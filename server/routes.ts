import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Follow, Post, User, WebSession, Notification, Monitor } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";

import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";
import { BadValuesError, NotAllowedError } from "./concepts/errors";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  /////////////////////
  // FOLLOW
  /////////////////////
  @Router.get("/follow")
  async getFollowRelations(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    // do some Response converting here?
    return await Follow.getRelations(user);
  }

  @Router.delete("/follow/following/:target")
  async stopFollowing(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    return await Follow.removeRelation(user, targetId);
  }

  @Router.delete("/follow/followers/:target")
  async removeFollower(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    return await Follow.removeRelation(targetId, user);
  }

  // TODO: fix Responses
  @Router.get("/follow/requests")
  async getFollowRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Follow.getRequests(user));
  }

  @Router.post("/follow/requests/:to")
  async sendFollowRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Follow.sendRequest(user, toId);
  }

  @Router.delete("/follow/requests/:to")
  async removeFollowRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Follow.removeRequest(user, toId);
  }

  @Router.put("/follow/accept/:from")
  async acceptFollowRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Follow.acceptRequest(fromId, user);
  }

  @Router.put("/follow/reject/:from")
  async rejectFollowRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Follow.rejectRequest(fromId, user);
  }

  /////////////////////
  // NOTIFICATIONS
  /////////////////////
  @Router.get("/notifications") 
  async getUserNotifications(session: WebSessionDoc) {
    WebSession.isLoggedIn(session);
    const user = WebSession.getUser(session);
    return await Notification.getUserNotifications(user);
  }

  @Router.post("/notifications/:username")
  // username is a url parameter, content is a body parameter
  async addNotification(username: string, content: string) {
      if (!username || !content) {
        throw new BadValuesError("Username and content must be non-empty!");
      }
      const user = await User.getUserByUsername(username);
      return await Notification.addNotification(user._id, content);
  }

  @Router.delete("/notifications/:notificationID")
  async removeNotification(session: WebSessionDoc, notificationID: string) {
    WebSession.isLoggedIn(session);
    if (!notificationID) {
      throw new BadValuesError("NotificationID must be non-empty!");
    }

    // check if user is allowed to remove notification
    const user_id = WebSession.getUser(session);
    Notification.userHasNotification(user_id, new ObjectId(notificationID));
    return await Notification.removeNotification(new ObjectId(notificationID))
  }

  @Router.patch("/notifications/:notificationID") 
  async readNotification(session: WebSessionDoc, notificationID: string) {
    WebSession.isLoggedIn(session);
    if (!notificationID) {
      throw new BadValuesError("NotificationID must be non-empty!");
    }

    // check if user is allowed to read notification
    const user_id = WebSession.getUser(session);
    Notification.userHasNotification(user_id, new ObjectId(notificationID));

    return await Notification.readNotification(new ObjectId(notificationID));
  }


  /////////////////////
  // MONITOR
  /////////////////////
  @Router.get("/monitorRelations/requests")
  async getMonitorRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.monitorRequests(await Monitor.getRequests(user));
  }

  @Router.post("/monitorRelations/requests/:to")
  async sendMonitorRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;

    if (user.toString() === toId.toString()) {
      throw new BadValuesError("You can't send a request to yourself!")
    }

    return await Monitor.sendRequest(user, toId);
  }

  @Router.delete("/monitorRelations/requests/:to")
  async removeMonitorRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;

    return await Monitor.removeRequest(user, toId);
  }

  @Router.put("/monitorRelations/requests/accept/:from")
  async acceptMonitorRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;

    return await Monitor.acceptShareRequest(fromId, user);
  }

  @Router.put("/monitorRelations/requests/reject/:from")
  async rejectMonitorRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;

    return await Monitor.rejectRequest(fromId, user);
  }


  @Router.get("/monitorRelations")
  async getMonitorRelations(session: WebSessionDoc) {
    const curr_user = WebSession.getUser(session);
    // TODO: Fix responses
    return /*await Responses.monitorRelations(*/await Monitor.getRelations(new ObjectId(curr_user));
  }

  @Router.delete("/monitorRelations/monitoring/:target")
  async stopMonitoring(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    return await Monitor.removeRelation(user, targetId);
  }

  @Router.delete("/monitorRelations/monitors/:target")
  async removeMonitor(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    return await Monitor.removeRelation(targetId, user);
  }

  



  // FOLLOW
  // Note: very similar to pre-implemented Friend concept, just need to add a few routes to Friend 
  // once repurposed. 


  // SCREENTIME
  @Router.post("/users/:user/screentime/:url")
  async setTimedUsed(url: string, username: string) {
    // set timeUsed for user for specified url
  }

  @Router.get("/users/:user/screentime/:url")
  async getTimedUsed(url: string, username: string) {
    // get timeUsed for user for specified url
  }

  // TIMERESTRICTION
  @Router.post("/users/:user/restrictions")
  async addRestriction(url: string, username: string) {
    // add restriction for user for specified url
  }

  @Router.delete("/users/:user/restrictions")
  async removeRestriction(url: string, username: string) {
    // remove restriction for user for specified url
  }

  @Router.get("/users/:user/restrictions/:url")
  async isRestricted(url: string, username: string) {
    // check restriction for user for specified url
  }

  // SEARCH
  @Router.get("/search")
  async searchPosts(search: string) {
    // return all posts matching some keywords
  }
}

export default getExpressRouter(new Routes());
