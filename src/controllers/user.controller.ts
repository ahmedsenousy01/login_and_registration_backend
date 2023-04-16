import { Request, Response, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import UserSchemas from "@/schemas/user.schemas";
import validationMiddleware from "@/middleware/validation.middleware";
import UserService from "@/services/user.service";
import { jwtTokenRequiringMiddleware } from "@/middleware/jwt.middleware";
import catchAsyncError from "@/utils/catchAsyncError";

class UserController implements Controller {
    public path = "/users";
    public router: Router;

    constructor() {
        this.router = Router();
        this.initRoutes();
    }

    private initRoutes(): void {
        this.router.post(
            `${this.path}/register`,
            validationMiddleware(UserSchemas.create),
            catchAsyncError(this.create)
        );

        this.router.post(
            `${this.path}/login`,
            validationMiddleware(UserSchemas.login),
            catchAsyncError(this.login)
        );
        
        this.router.post(
            `${this.path}/request-verification-code`,
            jwtTokenRequiringMiddleware,
            catchAsyncError(this.requestVerification)
        );

        this.router.get(
            `${this.path}`,
            jwtTokenRequiringMiddleware,
            catchAsyncError(this.getAllUsers)
        );

        this.router.get(
            `${this.path}/:id`,
            jwtTokenRequiringMiddleware,
            catchAsyncError(this.getUserById)
        );

        this.router.put(
            `${this.path}/verify-user`,
            jwtTokenRequiringMiddleware,
            catchAsyncError(this.verifyUser)
        );

        this.router.put(
            `${this.path}/:id`,
            jwtTokenRequiringMiddleware,
            catchAsyncError(this.updateUser)
        );

        this.router.delete(
            `${this.path}/:id`,
            jwtTokenRequiringMiddleware,
            catchAsyncError(this.deleteUser)
        );

    }

    async create(req: Request, res: Response): Promise<Response> {
        const { body } = req;
        const serviceResponse = await UserService.CreateUser(body);
        const statusCode: number = serviceResponse.status ? 201 : 400;

        return res.status(statusCode).json({
            message: serviceResponse.message,
            data: serviceResponse.data,
        });
    }

    async getAllUsers(req: Request, res: Response): Promise<Response> {
        const data = await UserService.GetAllUsers();
        return res.status(200).json({ data });
    }

    async getUserById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const user = await UserService.GetUser(id);
        return res.status(200).json({ data: user });
    }

    async updateUser(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const { body } = req;
        const user = await UserService.UpdateUser(id, body);
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ data: user });
    }

    async deleteUser(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const deleted = await UserService.DeleteUser(id);
        return res.status(200).json({ data: deleted });
    }

    async login(req: Request, res: Response): Promise<Response> {
        const { email, password } = req.body;
        const serviceResponse = await UserService.login(email, password);

        if (!serviceResponse.status) {
            return res.status(404).json({
                message: serviceResponse.message,
            });
        }

        return res.status(200).json({
            data: {
                message: serviceResponse.message,
                auth_token: serviceResponse.token,
            },
        });
    }

    async requestVerification(req: Request, res: Response): Promise<Response> {
        const { id } = res.locals.token;
        const serviceResponse = await UserService.requestVerificationCode(id);
        const statusCode: number = serviceResponse.status ? 200 : 500;

        return res
            .status(statusCode)
            .json({ message: serviceResponse.message });
    }

    async verifyUser(req: Request, res: Response): Promise<Response> {
        const { id } = res.locals.token;
        const { code } = req.body;

        const serviceResponse = await UserService.verifyUser(id, code);
        const statusCode: number = serviceResponse.verified ? 200 : 500;

        return res
            .status(statusCode)
            .json({ message: serviceResponse.message });
    }
}

export default new UserController();
