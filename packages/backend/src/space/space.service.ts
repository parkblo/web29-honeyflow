import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Space } from './space.entity';
import { MAX_SPACES } from 'src/common/constants/space.constants';
import { ERROR_MESSAGES } from 'src/common/constants/error.message.constants';
import { SnowflakeService } from 'src/common/utils/snowflake.service';
import { generateUuid } from 'src/common/utils/url.utils';
import { SpaceData, Node, Edge } from 'shared/types';
@Injectable()
export class SpaceService {
  constructor(
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  async create(userId: string, spaceName: string) {
    const Edges: SpaceData['edges'] = {};
    const Nodes: SpaceData['nodes'] = {};

    const headNode: Node = {
      id: generateUuid(),
      x: 0,
      y: 0,
      type: 'head',
      name: 'Hello',
    };
    Nodes[headNode.id] = headNode;

    const userSpaceCount = await this.spaceRepository.count({
      where: { userId },
    });

    if (userSpaceCount >= MAX_SPACES) {
      throw new BadRequestException(ERROR_MESSAGES.SPACE.LIMIT_EXCEEDED);
    }
    const spaceDto = {
      id: this.snowflakeService.generateId(),
      userId: userId,
      urlPath: generateUuid(),
      name: spaceName,
      edges: JSON.stringify(Edges),
      nodes: JSON.stringify(Nodes),
    };

    const space = await this.spaceRepository.save(spaceDto);
    return space.urlPath;
  }

  async findById(urlPath: string) {
    const result = await this.spaceRepository.findOne({
      where: { urlPath },
    });
    return result;
  }

  async updateByEdges(urlPath: string, edges: Edge[]) {
    const space = await this.findById(urlPath);
    if (!space) {
      throw new BadRequestException(ERROR_MESSAGES.SPACE.NOT_FOUND);
    }

    try {
      space.edges = JSON.stringify(edges);
      await this.spaceRepository.save(space);
      return space;
    } catch (error) {
      throw new BadRequestException(ERROR_MESSAGES.SPACE.UPDATE_FAILED);
    }
  }
  async updateByNodes(urlPath: string, nodes: Node[]) {
    const space = await this.findById(urlPath);
    if (!space) {
      throw new BadRequestException(ERROR_MESSAGES.SPACE.NOT_FOUND);
    }

    try {
      space.nodes = JSON.stringify(nodes);
      await this.spaceRepository.save(space);
      return space;
    } catch (error) {
      throw new BadRequestException(ERROR_MESSAGES.SPACE.UPDATE_FAILED);
    }
  }
}
