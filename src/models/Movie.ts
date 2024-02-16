import { Schema, model } from 'mongoose';
import { ActorType, actorSchema } from './Actor';

enum Genres {
    Action,
    Comedy,
    Drama,
    Fantasy,
    Horror,
    Mystery,
    Romance,
    Thriller,
    Western
}

export type MovieType = {
    title: string,
    year: number,
    genres: string[],
    directors: string[],
    actors: string[],
    producer: string,
    plot?: string,
    poster?: string
};

const schema = new Schema<MovieType>({
    title: {
        type: String, required: true,
        trim: true,
    },
    year: {
        type: Number, required: true,
        min: [1890, 'Year should be greater than 1890, got {VALUE}'],
    },
    genres: [{
        type: String, required: true,
        trim: true,
        enum: {
            values: Object.values(Genres),
            message: '{VALUE} is not a valid genre'
        }
    }],
    directors: [{
        type: String, required: true,
        trim: true
    }],
    actors: [{
        type: Schema.Types.ObjectId, required: true
    }],
    producer: {
        type: String, required: true,
        trim: true
    },
    plot: {
        type: String,
        trim: true
    },
    poster: {
        type: String,
        trim: true
    }
});

export const Movie = model<MovieType>('Movie', schema);