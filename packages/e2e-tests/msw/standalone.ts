import { createMiddleware } from "@mswjs/http-middleware";
import cors from "cors";
import express from "express";
import { createOAuthHandlers } from "./handlers";
import { MockOAuthProvider } from "./mockOAuthProvider";

const provider = new MockOAuthProvider();

const app = express();

app.use(cors());

app.use(createMiddleware(...createOAuthHandlers(provider)));

app.listen(5556);
