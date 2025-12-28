export interface IBaseEntity {
  id: number;
  externalId: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}
