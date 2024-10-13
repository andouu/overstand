export type Comment = {
  id: string;
  bookUid: string;
  content: string;
  pageNumber: number;
  likes: string[]; // Changed from number to string[]
  userUid: string;
  postedOn: Date;
};
