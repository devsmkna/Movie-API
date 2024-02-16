import request from 'supertest';
import app from '../app';
import { Actor } from '../models/Actor';
import assert from 'assert';
import { User } from '../models/User';
import { ActorType } from '../models/Actor';
import { Movie, MovieType } from '../models/Movie';

describe("Testing Actors", () => {
    // temporaty variables for database testing
    let idUser: string;
    let loggedUser: string;
    let exampleId: string;
    let movieId: string;

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
        await Actor.findByIdAndDelete(exampleId);
        await Movie.findByIdAndDelete(movieId);
        await User.findByIdAndDelete(idUser);
    });

    it("200 /actors - Get actors", async () => {
        const response = await request(app)
            .get("/actors")
            .set("Authorization", loggedUser);
        assert.equal(response.status, 200, "Actors not found");
        assert.equal(response.body.length, 0, "Actors not empty");
    });

    it("201 /actors - Create actor", async () => {
        const response = await request(app)
            .post("/actors")
            .set("Authorization", loggedUser)
            .send(exampleActor);
        assert.equal(response.status, 201, "Actor not created");
        assert.equal(typeof response.body.id, typeof "string", "Actor ID not a string");
        exampleId = response.body.id;

        // check actor added
        const checkResponse = await request(app)
            .get("/actors")
            .set("Authorization", loggedUser);
        assert.equal(checkResponse.status, 200, "Actors not found");
        assert.equal(checkResponse.body.length, 1, "Actors is empty");
    });

    it("200 /actors/:id/movies - Get all movies of one actor", async () => {
        // create a movie of this actor
        exampleMovie.actors.push(exampleId);
        const postResponse = await request(app)
            .post("/movies")
            .set("Authorization", loggedUser)
            .send(exampleMovie);
        assert.equal(postResponse.status, 201, "Movie not created");
        assert.equal(typeof postResponse.body.id, typeof "string", "Movie ID not a string");
        movieId = postResponse.body.id;

        const response = await request(app)
            .get(`/actors/${exampleId}/movies`);
        assert.equal(response.status, 200, "Movies not found");
        
        // check all actors
        const checkResponse = await request(app)
            .get("/actors")
            .set("Authorization", loggedUser);
        assert.equal(checkResponse.status, 200, "Actors not found");
        assert.equal(checkResponse.body.length, 1, "Actors is empty");
    });

    it("200 /actors - Update actor", async () => {
        // update actor
        exampleActor.name = "Updated";
        const response = await request(app)
            .put(`/actors/${exampleId}`)
            .set("Authorization", loggedUser)
            .send(exampleActor);
        assert.equal(response.status, 200, "Actor not updated");

        // check all actors
        const checkResponse = await request(app)
            .get("/actors")
            .set("Authorization", loggedUser);
        assert.equal(checkResponse.status, 200, "Actors not found");
        assert.equal(checkResponse.body.length, 1, "Actors is empty");
    });

    it("200 /actors - Delete actor", async () => {
        const response = await request(app)
            .delete(`/actors/${exampleId}`)
            .set("Authorization", loggedUser);
        assert.equal(response.status, 200, "Actor not deleted");
        
        // check all actors
        const checkResponse = await request(app)
            .get("/actors")
            .set("Authorization", loggedUser);
        assert.equal(checkResponse.status, 200, "Actors not found");
        assert.equal(checkResponse.body.length, 0, "Actors not empty");
    });
});