import request from 'supertest';
import app from '../app';
import { Movie, MovieType } from '../models/Movie';
import assert from 'assert';
import { User } from '../models/User';
import { Actor, ActorType } from '../models/Actor';

describe("Testing Movies", () => {
    // temporaty variables for database testing
    let idUser: string;
    let loggedUser: string;
    let exampleId: string;
    let exampleActorID: string;

    const exampleActor : ActorType = {
        name: "Robert Pattinson",
        bio: "Actor",
        avatar: "https://upload.wikimedia.org"
    }

    const exampleMovie: MovieType = {
        title: "The Batman",
        year: 2023,
        genres: ["Action", "Thriller"],
        directors: ["Matt Reeves"],
        actors: [],
        producer: "Warner Bros.",
        plot: "Batman is called to intervene when the mayor of Gotham City is murdered.",
        poster: "https://upload.wikimedia.org"
    };

    before("Signup and login", async () => {
        // signup
        const signupResponse = await request(app)
            .post("/auth/signup")
            .send({
                name: "DevsMachna",
                email: "devsmachna@email.com",
                password: "{StrongPassword1}"
            });
        assert.equal(signupResponse.status, 201, "User not created");
        assert.equal(typeof signupResponse.body.id, typeof "string", "User ID not a string");
        idUser = signupResponse.body.id;

        // verify
        const user = await User.findById(idUser);
        const verifyResponse = await request(app)
            .get(`/auth/verify/${user?.verificationCode}`);
        assert.equal(verifyResponse.status, 200, "User not verified");

        // login
        const loginResponse = await request(app)
            .post("/auth/login")
            .send({
                email: "devsmachna@email.com",
                password: "{StrongPassword1}"
            });
        assert.equal(loginResponse.status, 200, "Login failed");
        loggedUser = loginResponse.body.auth;
    });

    after("Delete movie after test", async () => {
        await Movie.findByIdAndDelete(exampleId);
        await Actor.findByIdAndDelete(exampleActorID);
        await User.findByIdAndDelete(idUser);
    });

    it("200 /movies - Get all movies", async () => {
        const response = await request(app)
            .get("/movies");
        assert.equal(response.status, 200, "Movies not found");
        assert.equal(response.body.length, 0, "Movies not empty");
    });

    it("201 /movies - Add new movie", async () => {
        // add actor
        const postActorResponse = await request(app)
            .post("/actors")
            .set("Authorization", loggedUser)
            .send(exampleActor);
        assert.equal(postActorResponse.status, 201, "Actor not created");
        assert.equal(typeof postActorResponse.body.id, typeof "string", "Actor ID not a string");
        exampleActorID = postActorResponse.body.id;

        // add movie
        exampleMovie.actors.push(exampleActorID);
        const postResponse = await request(app)
            .post("/movies")
            .set("Authorization", loggedUser)
            .send(exampleMovie);
        assert.equal(postResponse.status, 201, "Movie not created");
        assert.equal(typeof postResponse.body.id, typeof "string", "Movie ID not a string");
        exampleId = postResponse.body.id;

        // check if movie is added
        const movieResponse = await request(app)
            .get("/movies");
        assert.equal(movieResponse.status, 200, "Movies not found");
        assert.equal(movieResponse.body.length, 1, "Movies is empty");

        // check if actor is added
        const actorResponse = await request(app)
            .get("/actors");
        assert.equal(actorResponse.status, 200, "Actors not found");
        assert.equal(actorResponse.body.length, 1, "Actors is empty");
    });

    it("200 /movies/filter? - Filter movies", async () => {
        // filter movie by title
        const responseTitleFilter = await request(app)
            .get("/movies/filter?title=The Batman");
        assert.equal(responseTitleFilter.status, 200, "Movie not found by title");

        // filter movie by year
        const responseYearFilter = await request(app)
            .get("/movies/filter?year=2023");
        assert.equal(responseYearFilter.status, 200, "Movie not found by year");

        // filter movie by genre
        const responseGenreFilter = await request(app)
            .get("/movies/filter?genre=Action");
        assert.equal(responseGenreFilter.status, 200, "Movie not found by genre");

        // filter movie by director
        const responseDirectorFilter = await request(app)
            .get("/movies/filter?director=Matt Reeves");
        assert.equal(responseDirectorFilter.status, 200, "Movie not found by director");

        // filter movie by producer
        const responseProducerFilter = await request(app)
            .get("/movies/filter?producer=Robert Pattinson");
        assert.equal(responseProducerFilter.status, 200, "Movie not found by actor");

        // multiple filters
        const responseMultipleFilter = await request(app)
            .get("/movies/filter?title=The Batman&year=2023");
        assert.equal(responseMultipleFilter.status, 200, "Movie not found by multiple filters");
    });

    it("200 /movies/:id - Get movie by id", async () => {
        // get movie by id
        const response = await request(app)
            .get(`/movies/${exampleId}`);
        assert.equal(response.status, 200, "Movie not found");
    });

    it("200 /movies/:id - Update movie", async () => {
        // update movie
        exampleMovie.title = "Updated";
        const response = await request(app)
            .put(`/movies/${exampleId}`)
            .set("Authorization", loggedUser)
            .send(exampleMovie);
        assert.equal(response.status, 200, "Movie not updated");

        // check movies
        const movieResponse = await request(app)
            .get("/movies");
        assert.equal(movieResponse.status, 200, "Movies not found");
        assert.equal(movieResponse.body.length, 1, "Movies is empty");
    });

    it("200 /movies/:id - Delete movie", async () => {
        // delete movie
        const response = await request(app)
            .delete(`/movies/${exampleId}`)
            .set("Authorization", loggedUser);
        assert.equal(response.status, 200, "Movie not deleted");

        // check movies
        const movieResponse = await request(app)
            .get("/movies");
        assert.equal(movieResponse.status, 200, "Movies not found");
        assert.equal(movieResponse.body.length, 0, "Movies is not empty");
    });

    it("404 /movies/:id - Movie not found", async () => {
        // get unexistent movie by id
        const response = await request(app)
            .get(`/movies/${exampleId}`);
        assert.equal(response.status, 404, "Movie found");

        // check movies
        const movieResponse = await request(app)
            .get("/movies");
        assert.equal(movieResponse.status, 200, "Movies not found");
        assert.equal(movieResponse.body.length, 0, "Movies not empty");
    });

    it("400 /movies - Wrong parameters value", async () => {
        const wrongData = exampleMovie;
        
        // poster is not an url
        wrongData.poster = "test";
        const response = await request(app)
            .post("/movies")
            .send(exampleMovie);
        assert.equal(response.status, 400, "Movie created");
        wrongData.poster = exampleMovie.poster;

        // check movies
        const movieResponse = await request(app)
            .get("/movies");
        assert.equal(movieResponse.status, 200, "Movies not found");
        assert.equal(movieResponse.body.length, 0, "Movies not empty");
    });
});