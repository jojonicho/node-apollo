import { Resolver, Query, Mutation, Arg, Ctx, Int } from "type-graphql";
import { hash, compare } from "bcryptjs";
import { MyContext } from "./types/context";
import { User } from "../entity/User";
import { RegisterInput } from "../entity/types/Input";
import { COOKIE_NAME } from "../constants";
import { getConnection } from "typeorm";

@Resolver(User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  // @UseMiddleware(isAuth)
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) return null;
    return User.findOne(req.session.userId);
  }

  @Query(() => User, { nullable: true })
  async user(@Arg("id", () => Int) id: number) {
    const qb = getConnection()
      .getRepository(User)
      .createQueryBuilder("u")
      .innerJoinAndSelect("u.linkers", "l", "l.userId = :id", {
        id,
      });
    return await qb.getOne();
  }

  @Query(() => [User])
  users() {
    return User.find();
  }

  @Mutation(() => Boolean)
  async register(
    @Arg("input") { email, username, password }: RegisterInput
  ): Promise<boolean> {
    const hashedPassword = await hash(password, 12);
    try {
      const user = User.create({
        email,
        username,
        password: hashedPassword,
      });
      await user.save(); // important
      // await sendEmail(email, await createConfirmationUrl(user.id));
    } catch (err) {
      throw new Error(err);
    }
    return true;
  }

  // @Mutation(() => Boolean)
  // async confirmEmail(@Arg("token") token: string): Promise<boolean> {
  //   const userId = await redis.get(token);
  //   if (!userId) {
  //     return false;
  //   }
  //   await User.update({ id: parseInt(userId, 10) }, { confirmed: true });
  //   await redis.del(token);
  //   return true;
  // }

  @Mutation(() => User)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<User> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error("Invalid email");
    }

    const valid = await compare(password, user.password);

    if (!valid) {
      throw new Error("Invalid password");
    }

    //optional, cant really use redis with free heroku
    // if (!user.confirmed) {
    //   throw new Error("Please confirm your account");
    // }

    // login successful
    // sendRefreshToken(res, createRefreshToken(user));
    req.session.userId = user.id;

    return user;
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }

  @Mutation(() => String)
  changeImage(@Ctx() { req }: MyContext, @Arg("image") image: string) {
    if (!req.session.userId) return null;
    User.update({ id: req.session.userId }, { image });
    return image;
  }
}
