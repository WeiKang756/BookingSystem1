export interface IService {
  id?: number;
  name?: string;
  description?: string | null;
  price?: number;
}

export const defaultValue: Readonly<IService> = {};
