import { Router, Request, Response } from 'express';
import { param, body, matchedData, query } from 'express-validator';
import { checkValidation, isAuth } from '../middlewares/validations';
import { Movie } from '../models/Movie';
import { Actor } from '../models/Actor';

const router = Router();

// find all movies, or filer by query strings
router.get(
    "/",
    async (req: Request, res: Response) => {
        try {
            const movies = await Movie.find();
            return res.json(movies);
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// find movie by filers
router.get(
    "/filter",
    query("title").isString().trim().notEmpty().optional(),
    query("year").isInt({ min: 1890 }).toInt().optional(),
    query("genre").isString().trim().notEmpty().optional(),
    query("director").isString().trim().notEmpty().optional(),
    query("actor").isString().trim().notEmpty().optional(),
    query("producer").isString().trim().notEmpty().optional(),
    async (req: Request, res: Response) => {
        try {
            // get query parameters
            const { title, year, genre, director, actor, producer } = req.query;
            const movies = await Movie.find({
                ...(title ? { title: { $regex: title, $options: "i" } } : {}),
                ...(year ? { year: year } : {}),
                ...(genre ? { genres: { $in: [genre] } } : {}),
                ...(director ? { directors: { $in: [director] } } : {}),
                ...(producer ? { producer: { $regex: producer, $options: "i" } } : {})
            });
            return res.json(movies);
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
)

// get one movie by id
router.get(
    "/:id",
    param("id").isMongoId().trim().notEmpty(),
    checkValidation,
    async (req: Request, res: Response) => {
        try {
            const movie = await Movie.findById(req.params.id);
            if (!movie) return res.status(404).json({ message: "Movie not found" });
            return res.json(movie);
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// add movie
router.post(
    "/",
    body("title").isString().trim().notEmpty(),
    body("year").isInt({ min: 1890 }).toInt(),
    body("genres").isArray({ min: 1 }),
    body("genres.*").isString().trim().notEmpty(),
    body("directors").isArray({ min: 1 }),
    body("directors.*").isString().trim().notEmpty(),
    body("actors").isArray({ min: 1 }),
    body("actors.*").isMongoId().trim().notEmpty(),
    body("producer").isString().trim().notEmpty(),
    body("plot").isString().trim().notEmpty().optional(),
    body("poster").isURL().trim().notEmpty().optional(),
    checkValidation,
    isAuth,
    async (req: Request, res: Response) => {
        try {
            const movie = new Movie(matchedData(req));
            movie.actors.map(async (actorId) => {
                if(!await Actor.findById(actorId)) {
                    return res.status(404).json({ message: "Actor not found" });
                }
            });
            await movie.save();
            return res.status(201).json({
                message: "Movie created successfully",
                id: movie.id
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// update movie
router.put(
    "/:id",
    param("id").isMongoId().trim().notEmpty(),
    body("title").isString().trim().notEmpty(),
    body("year").isInt({ min: 1890 }).toInt(),
    body("genres").isArray({ min: 1 }),
    body("genres.*").isString().trim().notEmpty(),
    body("directors").isArray({ min: 1 }),
    body("directors.*").isString().trim().notEmpty(),
    body("actors").isArray({ min: 1 }),
    body("actors.*").isMongoId().trim().notEmpty(),
    body("producer").isString().trim().notEmpty(),
    body("plot").isString().trim().notEmpty().optional(),
    body("poster").isURL().trim().notEmpty().optional(),
    checkValidation,
    isAuth,
    async (req: Request, res: Response) => {
        try {
            const movie = await Movie.findByIdAndUpdate(req.params.id, req.body);
            if (!movie) return res.status(404).json({ message: "Movie not found" });
            return res.status(200).json({
                message: "Movie updated successfully"
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// delete movie
router.delete(
    "/:id",
    param("id").isMongoId().trim().notEmpty(),
    checkValidation,
    isAuth,
    async (req: Request, res: Response) => {
        try {
            const movie = await Movie.findByIdAndDelete(req.params.id);
            if (!movie) return res.status(404).json({ message: "Movie not found" });
            return res.status(200).json({
                message: "Movie deleted successfully"
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
)

export default router;