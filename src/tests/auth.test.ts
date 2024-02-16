import request from "supertest";
import app from "../app";
import { User } from "../models/User";
import assert from "assert";

describe("Testing Auth", () => {
    describe("/auth/signup - Testing signup", () => {
        let idUser: string;

        const exampleUser = {
            name: "DevsMachna",
            email: "devsmachna@email.com",
            password: "{StrongPassword1}"
        }

        after("Delete user after test", async () => {
            await User.findByIdAndDelete(idUser);
        });

        it("201 - New user", async () => {
            const response = await request(app)
                .post("/auth/signup")
                .send(exampleUser);
            assert.equal(response.status, 201, "User not created");
            assert.equal(typeof response.body.id, typeof "string", "User ID not a string");
            idUser = response.body.id;
        });

        it("409 - New user with same credential of verified user", async () => {
            // verify
            const user = await User.findById(idUser);
            const verifyResponse = await request(app)
                .get(`/auth/verify/${user?.verificationCode}`);
            assert.equal(verifyResponse.status, 200, "User not verified");

            // signup with already verified credentials
            const response = await request(app)
                .post("/auth/signup")
                .send(exampleUser);
            assert.equal(response.status, 409, "User with same credential created");
        });

        it("400 - Missing credentials", async () => {
            // missing name
            const noNameResponse = await request(app)
                .post("/auth/signup")
                .send({
                    password: exampleUser.password,
                    email: exampleUser.email
                });
            assert.equal(noNameResponse.status, 400, "Missing name parameter");

            // missing email
            const noEmailResponse = await request(app)
                .post("/auth/signup")
                .send({
                    password: exampleUser.password,
                    name: exampleUser.name
                });
            assert.equal(noEmailResponse.status, 400, "Missing email parameter");

            // missing password
            const noPasswordResponse = await request(app)
                .post("/auth/signup")
                .send({
                    name: exampleUser.name,
                    email: exampleUser.email
                });
            assert.equal(noPasswordResponse.status, 400, "Missing password parameter");
        });

        it("400 - Weak password", async () => {
            exampleUser.password = "1234";
            const response = await request(app)
                .post("/auth/signup")
                .send(exampleUser);
            assert.equal(response.status, 400);
        });
    });

    describe("/auth/verify - Testing verify", () => {
        let idUser: string;

        const exampleUser = {
            name: "DevsMachna",
            email: "devsmachna@email.com",
            password: "{StrongPassword1}"
        }

        after("Delete user after test", async () => {
            await User.findByIdAndDelete(idUser);
        });

        it("200 - Verify", async () => {
            // signup
            const signupResponse = await request(app)
                .post("/auth/signup")
                .send(exampleUser);
            assert.equal(signupResponse.status, 201, "User not created");
            assert.equal(typeof signupResponse.body.id, typeof "string", "User ID not a string");
            idUser = signupResponse.body.id;

            // verify
            const user = await User.findById(idUser);
            const verifyResponse = await request(app)
                .get(`/auth/verify/${user?.verificationCode}`);
            assert.equal(verifyResponse.status, 200, "User not verified");
        });

        it("400 - Invalid verification code", async () => {
            const response = await request(app)
                .get("/auth/verify/1234");
            assert.equal(response.status, 400, "Invalid verification code");
        });

        it("400 - Missing verification code", async () => {
            const response = await request(app)
                .get("/auth/verify");
            assert.equal(response.status, 404, "Missing verification code");
        });
    })

    describe("/auth/login - Testing login", () => {
        let idUser: string;
        let loggedUser: string;

        const exampleUser = {
            name: "DevsMachna",
            email: "devsmachna@email.com",
            password: "{StrongPassword1}"
        }

        before("Signup and verify user before test", async () => {
            // signup
            const signupResponse = await request(app)
                .post("/auth/signup")
                .send(exampleUser);
            assert.equal(signupResponse.status, 201, "User not created");
            assert.equal(typeof signupResponse.body.id, typeof "string", "User ID not a string");
            idUser = signupResponse.body.id;

            // verify
            const user = await User.findById(idUser);
            const verifyResponse = await request(app)
                .get(`/auth/verify/${user?.verificationCode}`);
            assert.equal(verifyResponse.status, 200, "User not verified");
        });

        after("Delete user after test", async () => {
            await User.findByIdAndDelete(idUser);
        });

        it("200 - Login", async () => {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send(exampleUser);
            assert.equal(loginResponse.status, 200, "Login failed");
            loggedUser = loginResponse.body.auth;
        });

        it("400 - Missing credentials", async () => {
            // missing email
            const noEmailResponse = await request(app)
                .post("/auth/login")
                .send({
                    password: exampleUser.password
                });
            assert.equal(noEmailResponse.status, 400, "Missing email parameter");

            // missing password
            const noPasswordResponse = await request(app)
                .post("/auth/login")
                .send({
                    email: exampleUser.email
                });
            assert.equal(noPasswordResponse.status, 400, "Missing password parameter");
        });
    });

    describe("/auth/me - Testing user info", () => {
        let idUser: string;
        let loggedUser: string;

        const exampleUser = {
            name: "DevsMachna",
            email: "devsmachna@email.com",
            password: "{StrongPassword1}"
        }

        before("Signup and verify user before test", async () => {
            // signup
            const signupResponse = await request(app)
                .post("/auth/signup")
                .send(exampleUser);
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
                .send(exampleUser);
            assert.equal(loginResponse.status, 200, "Login failed");
            loggedUser = loginResponse.body.auth;
        });

        after("Delete user after test", async () => {
            await User.findByIdAndDelete(idUser);
        });

        it("200 - Get user info", async () => {
            const response = await request(app)
                .get("/auth/me")
                .set("Authorization", loggedUser);
            assert.equal(response.status, 200, "User not found");
        });

        it("200 - Change user info", async () => {
            // change name
            const changeNameResponse = await request(app)
                .patch("/auth/me")
                .set("Authorization", loggedUser)
                .send({
                    name: "Dev"
                });
            assert.equal(changeNameResponse.status, 200, "Name not changed");

            // change avatar
            const changeAvatarResponse = await request(app)
                .patch("/auth/me")
                .set("Authorization", loggedUser)
                .send({
                    avatar: "https://example.com/avatar"
                });
            assert.equal(changeAvatarResponse.status, 200, "Avatar not changed");
        });

        it("404 - User not found", async () => {
            // DELETING USER HERE
            await User.findByIdAndDelete(idUser);
            const response = await request(app)
                .patch("/auth/me")
                .set("Authorization", loggedUser)
                .send({
                    name: "Deus"
                });
            assert.equal(response.status, 404);
        });
    });

    describe("/auth/reset - Testing reset password", () => {
        let idUser: string;
        let loggedUser: string;

        const exampleUser = {
            name: "DevsMachna",
            email: "devsmachna@email.com",
            password: "{StrongPassword1}"
        };

        before("Signup and verify user before test", async () => {
            // signup
            const signupResponse = await request(app)
                .post("/auth/signup")
                .send(exampleUser);
            assert.equal(signupResponse.status, 201, "User not created");
            assert.equal(typeof signupResponse.body.id, typeof "string", "User ID not a string");
            idUser = signupResponse.body.id;

            // verify
            const user = await User.findById(idUser);
            const verifyResponse = await request(app)
                .get(`/auth/verify/${user?.verificationCode}`);
            assert.equal(verifyResponse.status, 200, "User not verified");
        });

        after("Delete user after test", async () => {
            await User.findByIdAndDelete(idUser);
        });

        it("200 - Reset password", async () => {
            // generate reset code
            const resetResponse = await request(app)
                .post("/auth/reset")
                .send({
                    email: exampleUser.email
                });
            assert.equal(resetResponse.status, 200, "Reset code not generated");
            loggedUser = resetResponse.body.auth;
            
            // get reset code
            const updateUser = await User.findById(idUser);
            const resetPasswordCode = updateUser?.resetPasswordCode;

            // reset password
            const newPassword = "{StrongPassword2}";
            const resetCodeResponse = await request(app)
                .patch(`/auth/reset/${resetPasswordCode}`)
                .set("Authorization", loggedUser)
                .send({
                    password: newPassword
                });
            assert.equal(resetCodeResponse.status, 200, "Reset password failed");
        });

        it("400 - Missing email", async () => {
            const resetCodeResponse = await request(app)
                .patch(`/auth/reset`)
                .set("Authorization", loggedUser);
            assert.equal(resetCodeResponse.status, 404, "Missing email parameter");
        })

        it("400 - Invalid reset code", async () => {
            const resetCodeResponse = await request(app)
                .patch(`/auth/reset/invalid`)
                .set("Authorization", loggedUser)
                .send({
                    password: "{StrongPassword2}"
                });
            assert.equal(resetCodeResponse.status, 400, "Invalid reset code");
        });

        it("404 - User not found", async () => {
            // get reset code
            const updateUser = await User.findById(idUser);
            const resetPasswordCode = updateUser?.resetPasswordCode;

            // delete user
            await User.findByIdAndDelete(idUser);

            // reset password with missing user
            const resetCodeResponse = await request(app)
                .patch(`/auth/reset/${resetPasswordCode}`)
                .set("Authorization", loggedUser)
                .send({
                    password: "{StrongPassword2}"
                });
            assert.equal(resetCodeResponse.status, 404, "User not found");
        });
    });
});
