import { Schema, model } from "mongoose";

export type ActorType = {
    name: string,
    bio?: string,
    avatar?: string
};

export const actorSchema = new Schema<ActorType>({
    name: {
        type: String, required: true
    },
    bio: {
        type: String
    },
    avatar: {
        type: String
    }
});

export const Actor = model<ActorType>("Actor", actorSchema);