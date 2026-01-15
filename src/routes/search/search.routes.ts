import { Router } from "express";
import { searchController } from "../../controllers/search.controller";

const searchRouter = Router();

// Search groups
searchRouter.get("/groups", searchController.searchGroups);

// Search posts
searchRouter.get("/posts", searchController.searchPosts);

// Search users
searchRouter.get("/users", searchController.searchUsers);

// Filter posts (no search query)
searchRouter.get("/filter/posts", searchController.filterPosts);

export { searchRouter };
