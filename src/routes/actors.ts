import { Router, Request, Response } from 'express';
import { param, body, matchedData, query } from 'express-validator';
import { checkValidation, isAuth } from '../middlewares/validations';
import { Movie } from '../models/Movie';
import { Actor } from '../models/Actor';

const router = Router();

// get all actors
router.get(
    "/",
    async (req: Request, res: Response) => {
        try {
            const actors = await Actor.find();
            return res.json(actors);
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// get actor by id
router.get(
    "/:id",
    param("id").isMongoId().trim().notEmpty(),
    checkValidation,
    async (req: Request, res: Response) => {
        try {
            const actor = await Actor.findById(req.params.id);
            if (!actor) return res.status(404).json({ message: "Actor not found" });
            return res.json(actor);
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// get all movies of an actor
router.get(
    "/:id/movies",
    param("id").isMongoId().trim().notEmpty(),
    checkValidation,
    async (req: Request, res: Response) => {
        try {
            const actor = await Actor.findById(req.params.id);
            if (!actor) return res.status(404).json({ message: "Actor not found" });
            return res.json(await Movie.find({ actors: { $in: [actor.id] } }));
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// add actor
router.post(
    "/",
    body("name").isString().trim().notEmpty(),
    body("bio").isString().trim().notEmpty().optional(),
    body("avatar").isURL().trim().notEmpty().optional(),
    checkValidation,
    isAuth,
    async (req: Request, res: Response) => {
        try {
            const actor = await Actor.create(matchedData(req));
            return res.status(201).json({
                message: "Actor created successfully",
                id: actor.id
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// update actor
router.put(
    "/:id",
    body("name").isString().trim().notEmpty(),
    body("bio").isString().trim().notEmpty().optional(),
    body("avatar").isURL().trim().notEmpty().optional(),
    checkValidation,
    isAuth,
    async (req: Request, res: Response) => {
        try {
            const actor = await Actor.findByIdAndUpdate(req.params.id, matchedData(req), { new: true });
            if (!actor) return res.status(404).json({ message: "Actor not found" });
            return res.json({
                message: "Actor updated successfully",
                id: actor._id
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

// delete actor
router.delete(
    "/:id",
    param("id").isMongoId().trim().notEmpty(),
    checkValidation,
    isAuth,
    async (req: Request, res: Response) => {
        try {
            const actor = await Actor.findByIdAndDelete(req.params.id);
            if (!actor) return res.status(404).json({ message: "Actor not found" });
            return res.status(200).json({
                message: "Actor deleted successfully"
            });
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }
);

export default router;