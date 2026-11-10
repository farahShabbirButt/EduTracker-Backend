export type AttentionLink = 'marks' | 'conduct' | 'subjects' | 'grades';

export interface IAttentionItem {
  title: string;
  detail: string;
  link: AttentionLink;
  classExternalId?: string;
  testExternalId?: string;
}
