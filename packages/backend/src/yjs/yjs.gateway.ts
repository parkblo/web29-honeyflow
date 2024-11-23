import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { SpaceService } from 'src/space/space.service';

import { NoteService } from 'src/note/note.service';
import { parseSocketUrl } from 'src/common/utils/socket.util';
import { WebsocketStatus } from 'src/common/constants/websocket.constants';
import { Server } from 'ws';
import { Request } from 'express';
import {
  setupWSConnection,
  setPersistence,
  setContentInitializor,
  // @ts-expect-error /
} from 'y-websocket/bin/utils';
import * as Y from 'yjs';
import { ERROR_MESSAGES } from 'src/common/constants/error.message.constants';
import { generateUuid } from 'src/common/utils/url.utils';
const SPACE = 'space';
const NOTE = 'note';

import { SpaceData } from 'shared/types';

@WebSocketGateway(9001)
export class YjsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(YjsGateway.name);
  constructor(
    private readonly spaceService: SpaceService,
    private readonly noteService: NoteService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(connection: WebSocket, request: Request) {
    this.logger.log('connection start');

    try {
      const url = request.url || '';
      const { urlType, urlId } = parseSocketUrl(url);
      if (!this.validateUrl(urlType, urlId)) {
        connection.close(
          WebsocketStatus.POLICY_VIOLATION,
          ERROR_MESSAGES.SOCKET.INVALID_URL,
        );
        return;
      }
      this.logger.log(`Parsed URL - Type: ${urlType}, ID: ${urlId}`);
      urlType === SPACE
        ? await this.initializeSpace(connection, request, urlId as string)
        : await this.initializeNote(connection, request, urlId as string);
    } catch (error) {
      this.logger.error(`Connection failed for : ${error.message}`);
    }
  }

  handleDisconnect(connection: WebSocket) {
    this.logger.log(`connection end`);
  }

  private validateUrl(urlType: string | null, urlId: string | null): boolean {
    if (!urlType || !urlId || (urlType !== 'space' && urlType !== 'note')) {
      return false;
    }
    return true;
  }

  private async initializeSpace(
    connection: WebSocket,
    request: Request,
    urlId: string,
  ) {
    const space = await this.spaceService.findById(urlId);
    if (!space) {
      connection.close(
        WebsocketStatus.POLICY_VIOLATION,
        ERROR_MESSAGES.SPACE.NOT_FOUND,
      );
      return;
    }

    const parsedSpace = {
      ...space,
      edges: JSON.parse(space.edges),
      nodes: JSON.parse(space.nodes),
    };

    setPersistence({
      bindState: (docName: string, ydoc: Y.Doc) => {
        const yContext = ydoc.getMap('context');
        const yEdges = yContext.get('edges');
        const yNodes = yContext.get('nodes');

        console.log(JSON.stringify(yEdges));
        console.log(JSON.stringify(yNodes));
      },
      writeState: (docName: string, ydoc: Y.Doc) => {
        const yContext = ydoc.getMap('context');
        const yEdges = yContext.get('edges');
        const yNodes = yContext.get('nodes');

        console.log(JSON.stringify(yEdges));
        console.log(JSON.stringify(yNodes));

        return Promise.resolve();
      },
    });

    setContentInitializor((ydoc: Y.Doc) => {
      this.setYSpace(ydoc, parsedSpace);
    });

    setupWSConnection(connection, request, {
      docName: parsedSpace.name,
    });
  }

  private async setYSpace(ydoc: Y.Doc, parsedSpace) {
    const yContext = ydoc.getMap('context');

    const yEdges = new Y.Map();
    const yNodes = new Y.Map();

    const edges = parsedSpace.edges;
    const nodes = parsedSpace.nodes;

    Object.entries(edges).forEach(([edgeId, edge]) => {
      yEdges.set(edgeId, edge);
    });

    Object.entries(nodes).forEach(([nodeId, node]) => {
      yNodes.set(nodeId, node);
    });

    yContext.set('edges', yEdges);
    yContext.set('nodes', yNodes);
  }
  private async initializeNote(
    connection: WebSocket,
    request: Request,
    urlId: string,
  ) {
    const note = await this.noteService.findById(urlId);
    if (!note) {
      connection.close(
        WebsocketStatus.POLICY_VIOLATION,
        ERROR_MESSAGES.NOTE.NOT_FOUND,
      );
      return;
    }
    connection.send(JSON.stringify(note));
    setupWSConnection(connection, request, {
      docName: note.name,
    });
  }
}
