export type Comment = {
  id: string;
  bookUid: string;
  content: string;
  pageNumber: number;
  likes: number;
  userUid: string;
  postedOn: Date;
};
