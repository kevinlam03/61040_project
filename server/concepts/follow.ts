import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";


export interface FollowRelationDoc extends BaseDoc {
  viewer: ObjectId;
  target: ObjectId;
}

export interface FollowRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  status: "pending" | "rejected" | "accepted";
}

export default class FollowConcept {
  public readonly relations: DocCollection<FollowRelationDoc>;
  public readonly requests: DocCollection<FollowRequestDoc>;
  
  constructor(
    relationName: string, 
    requestsName: string, 
  ) {
    this.relations = new DocCollection<FollowRelationDoc>(relationName);
    this.requests = new DocCollection<FollowRequestDoc>(requestsName);
  }
  

  async getRequests(user: ObjectId) {
    return await this.requests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }

  // Monitor Relations will be able to send share requests to share usage data
  // Follow Relations will be able to send normal requests to view content
  // The sending is normal
  
  async sendRequest(from: ObjectId, to: ObjectId) {
    await this.canSendRequest(from, to);
    await this.requests.createOne({ from, to, status: "pending" });
    return { msg: "Sent request!" };
  }

  // The accepting creates a relation in different ways

  async acceptRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    // Following two can be done in parallel, thus we use `void`
    void this.requests.createOne({ from, to, status: "accepted" });
    void this.addFollowRelation(from, to);
    return { msg: "Accepted request!" };
  }


  // When accepting a share request, the person accepting ("to") now follows the ("from")
  async acceptShareRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    // Following two can be done in parallel, thus we use `void`
    void this.requests.createOne({ from, to, status: "accepted" });
    void this.addFollowRelation(from, to);
    return { msg: "Accepted request!" };
  }

  async rejectRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    await this.requests.createOne({ from, to, status: "rejected" });
    return { msg: "Rejected request!" };
  }

  async removeRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    return { msg: "Removed request!" };
  }


  // Either person in the relation has the ability to remove the other person
  async removeRelation(viewer: ObjectId, target: ObjectId) {
    const followRelation = await this.relations.popOne({ viewer, target });
    if (followRelation === null) {
      throw new RelationNotFoundError(viewer, target);
    }
    // remove accepted follow request?
    await this.requests.deleteOne({from: viewer, to: target})
    return { msg: "Relation removed!" };
  }

  async getRelations(user: ObjectId) {
    // returning all relations with this user for now
    const relations = await this.relations.readMany({
      $or: [{ viewer: user }, { target: user }],
    });

    return relations
  }

  private async addFollowRelation(viewer: ObjectId, target: ObjectId) {
    void this.relations.createOne({ viewer, target });
  }

  private async removePendingRequest(from: ObjectId, to: ObjectId) {
    const request = await this.requests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new FollowRequestNotFoundError(from, to);
    }
    return request;
  }

  async isNotViewing(viewer: ObjectId, target: ObjectId) {
    const relation = await this.relations.readOne({ viewer, target});
    if (relation !== null || viewer.toString() === target.toString()) {
      throw new RelationAlreadyExistsError(viewer, target);
    }
  }

  async isViewing(viewer: ObjectId, target: ObjectId) {
    const relation = await this.relations.readOne({ viewer, target});
    if (relation === null && viewer.toString() !== target.toString()) {
      throw new RelationNotFoundError(viewer, target);
    }
  }
  

  private async canSendRequest(u1: ObjectId, u2: ObjectId) {
    await this.isNotViewing(u1, u2);
    // check if there is pending request between these users
    const request = await this.requests.readOne({
      from: { $in: [u1, u2] },
      to: { $in: [u1, u2] },
      status: "pending",
    });
    if (request !== null) {
      throw new FollowRequestAlreadyExistsError(u1, u2);
    }
  }
}

export class FollowRequestNotFoundError extends NotFoundError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Follow request from {0} to {1} does not exist!", from, to);
  }
}

export class FollowRequestAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Follow request between {0} and {1} already exists!", from, to);
  }
}

export class RelationNotFoundError extends NotFoundError {
  constructor(
    public readonly viewer: ObjectId,
    public readonly target: ObjectId,
  ) {
    super("{0} is not currently viewing {1}. The relation doesn't exist!", viewer, target);
  }
}

export class RelationAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly viewer: ObjectId,
    public readonly target: ObjectId,
  ) {
    super("{viewer} is already viewing {target}. The relation already exists!", viewer, target);
  }
}
