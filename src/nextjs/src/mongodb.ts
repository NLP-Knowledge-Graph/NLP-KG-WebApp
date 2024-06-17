import { MongoClient } from "mongodb";
import { env } from "./env.cjs";
import mongoose, { Mongoose } from "mongoose";
import { v4 as uuid } from "uuid";

const globalForMongodb = globalThis as unknown as {
  client: Promise<MongoClient> | undefined;
  db: Promise<Mongoose> | undefined;
};

const uri = env.MONGODB_URL;
const options = {};

let client: Promise<MongoClient>;
let db: Promise<Mongoose>;

client = globalForMongodb.client ?? new MongoClient(uri, options).connect();
db = globalForMongodb.db ?? mongoose.connect(uri);

if (env.NODE_ENV !== "production") {
  globalForMongodb.client = client;
  globalForMongodb.db = db;
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { client, db };

const Schema = mongoose.Schema;

export type Profile = {
  userid: string;
  username: string;
  openaikey?: string;
  image?: string;
};

const profileSchema = new Schema<Profile>({
  userid: { type: String, required: true },
  username: { type: String, required: true },
  openaikey: { type: String, required: false },
  image: { type: String, required: false },
});

export const profileModel = () =>
  mongoose.models && mongoose.models.Profile
    ? (mongoose.models.Profile as mongoose.Model<Profile>)
    : mongoose.model<Profile>("Profile", profileSchema);

export type BookmarkList = {
  userid: string;
  listid: string;
  name: string;
  notes?: string;
  public: boolean;
};

const bookmarkListSchema = new Schema<BookmarkList>({
  userid: { type: String, required: true },
  listid: { type: String, default: uuid },
  name: { type: String, required: true },
  notes: { type: String, required: false },
  public: { type: Boolean, required: true, default: false },
});

export const bookmarklistModel = () =>
  mongoose.models && mongoose.models.BookmarkList
    ? (mongoose.models.BookmarkList as mongoose.Model<BookmarkList>)
    : mongoose.model<BookmarkList>("BookmarkList", bookmarkListSchema);

export type Bookmark = {
  listid: string;
  publication: string;
};

const bookmarkSchema = new Schema<Bookmark>({
  listid: { type: String, required: true },
  publication: { type: String, required: true },
});

export const bookmarkModel = () =>
  mongoose.models && mongoose.models.Bookmark
    ? (mongoose.models.Bookmark as mongoose.Model<Bookmark>)
    : mongoose.model<Bookmark>("Bookmark", bookmarkSchema);

export type Collaboration = {
  listid: string;
  userid: string;
  status: "pending" | "accepted" | "declined";
};

const collaborationSchema = new Schema<Collaboration>({
  listid: { type: String, required: true },
  userid: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
    required: true,
  },
});

export const collaborationModel = () =>
  mongoose.models && mongoose.models.Collaboration
    ? (mongoose.models.Collaboration as mongoose.Model<Collaboration>)
    : mongoose.model<Collaboration>("Collaboration", collaborationSchema);

export type ChatHistory = {
  chatid: string;
  type: string;
  userid: string;
  name: string;
  date: Date;
  message: Array<{
    text: string;
    sender: "bot" | "system" | "user";
    conceptFromOpenApi?: string;
    publicationTitles?: string[];
    publicationIds?: string[];
    publications?: string[];
  }>;
};

const chatHistorySchema = new Schema<ChatHistory>({
  chatid: { type: String, default: uuid },
  type: { type: String, required: true },
  userid: { type: String, required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  message: [
    {
      text: { type: String, required: true },
      sender: { type: String, enum: ["bot", "system", "user"], required: true },
      conceptFromOpenApi: { type: String, required: false },
      publicationTitles: [{ type: String }],
      publicationIds: [{ type: String }],
      publications: [{ type: String }],
    },
  ],
});

export const chatHistoryModel = () =>
  mongoose.models && mongoose.models.ChatHistory
    ? (mongoose.models.ChatHistory as mongoose.Model<ChatHistory>)
    : mongoose.model<ChatHistory>("ChatHistory", chatHistorySchema);
