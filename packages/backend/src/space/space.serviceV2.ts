import { Injectable } from '@nestjs/common';
import { SnowflakeService } from 'src/common/utils/snowflake.service';
import { v4 as uuid } from 'uuid';
import { SpaceData, Node } from 'shared/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SpaceValidationServiceV2 } from './space.validation.serviceV2';
import { SpaceDocument } from '../collaborative/schemas/space.schema';

@Injectable()
export class SpaceServiceV2 {
  constructor(
    private readonly snowflakeService: SnowflakeService,
    private readonly spaceValidationService: SpaceValidationServiceV2,
    @InjectModel(SpaceDocument.name)
    private readonly spaceModel: Model<SpaceDocument>,
  ) {}
  async findById(id: string) {
    const result = await this.spaceModel.findOne({ id }).exec();
    return result;
  }
  async create(
    userId: string,
    spaceName: string,
    parentContextNodeId: string | null,
  ) {
    const Edges: SpaceData['edges'] = {};
    const Nodes: SpaceData['nodes'] = {};
    const headNode: Node = {
      id: uuid(),
      x: 0,
      y: 0,
      type: 'head',
      name: spaceName,
      src: uuid(),
    };
    Nodes[headNode.id] = headNode;

    await this.spaceValidationService.validateSpaceLimit(userId);
    await this.spaceValidationService.validateParentNodeExists(
      parentContextNodeId,
    );

    const spaceDto = {
      id: this.snowflakeService.generateId(),
      parentSpaceId:
        parentContextNodeId === null ? undefined : parentContextNodeId,
      userId: userId,
      urlPath: headNode.src,
      name: spaceName,
      edges: JSON.stringify(Edges),
      nodes: JSON.stringify(Nodes),
    };
    return this.spaceModel.create(spaceDto);
  }

  async existsByUrlPath(urlPath: string) {
    return this.spaceModel.findOne({ urlPath }).exec();
  }
}