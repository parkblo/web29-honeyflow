import { BreadcrumbItem } from "shared/types";

import { API_V1_URL, API_V3_URL } from "./constants";
import http from "./http";

type CreateSpaceRequestBody = {
  userId: string;
  spaceName: string;
  parentContextNodeId: string | null;
};

type CreateSpaceResponseBody = {
  urlPath: [string];
};

export async function createSpace(body: CreateSpaceRequestBody) {
  const response = await http.post<CreateSpaceResponseBody>(
    `${API_V3_URL}/space`,
    { body: JSON.stringify(body) },
  );
  return response.data;
}

type GetBreadcrumbResponseBody = BreadcrumbItem[];

export async function getBreadcrumbOfSpace(spaceUrlPath: string) {
  const response = await http.get<GetBreadcrumbResponseBody>(
    `${API_V1_URL}/space/breadcrumb/${spaceUrlPath}`,
  );
  return response.data;
}
