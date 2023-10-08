import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";
import { FriendRequestDoc } from "./friend";

export interface MonitorRelationDoc extends BaseDoc {
  monitor: ObjectId;
  monitored: ObjectId;
}

export interface MonitorRequestDoc extends FriendRequestDoc {
  // from: ObjectId, to: ObjectId, status
}

export default class MonitorConcept {
  public readonly monitors = new DocCollection<MonitorRelationDoc>("monitors");
  public readonly requests = new DocCollection<MonitorRequestDoc>("monitorRequests");


  async getRequests(user: ObjectId) {
    return await this.requests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }

  async sendMonitorRequest(from: ObjectId, to: ObjectId) {
    // confirm request and relation don't already exist
    // Note: can't send another request if you've been rejected
    void this.isNotRequested(from, to);
    void this.notMonitored(from, to);

    
    // add a monitor request from this person
    await this.requests.createOne({from, to, status:"pending"});
    return { msg: "Sent monitor request!"};
  }

  async acceptRequest(from: ObjectId, to: ObjectId) {
    // try to pop pending request
    await this.removeRequest(from, to, "pending");
    void this.addMonitor(to, from);
    
    // add accepted request 
    void this.requests.createOne({ from, to, status: "accepted" });
    
    return { msg: "Accepted request!" };
  }

  async rejectRequest(from: ObjectId, to: ObjectId) {
    await this.removeRequest(from, to, "pending");
    await this.requests.createOne({ from, to, status: "rejected" });
    return { msg: "Rejected request!" };
  }

  async removeRequest(from: ObjectId, to: ObjectId, status: string) {
    if (status !== "pending" && status !== "accepted" && status !== "rejected") {
      throw new BadValuesError("Status must be pending, accepted, or rejected!")
    }

    const request = await this.requests.popOne({ from, to, status });
    if (request === null) {
      throw new MonitorRequestNotFoundError(from, to);
    }
    return { msg: "Removed request!"};
  }

  async isRequested(from: ObjectId, to: ObjectId) {
    const req = await this.requests.readOne({from, to});
    if (req === null) {
      throw new MonitorRequestNotFoundError(from, to)
    }
  }

  async isNotRequested(from: ObjectId, to: ObjectId) {
    const req = await this.requests.readOne({from, to});
    if (req !== null) {
      throw new MonitorRequestAlreadyExistsError(from, to)
    }
  }


  

  private async addMonitor(monitor: ObjectId, monitored: ObjectId) {
    await this.notMonitored(monitored, monitor);
    await this.monitors.createOne({ monitor, monitored });
    
    return { msg: "Monitor added!"}
  }

  async removeMonitor(monitor: ObjectId, monitored: ObjectId) {
    console.log(monitored, monitor);
    await this.isMonitored(monitored, monitor);
    await this.monitors.popOne({monitor, monitored});
    
    // remove the accepted request, from is the monitored person 
    await this.removeRequest(monitored, monitor, "accepted");
    return { msg: "Monitor removed!" };
  }

  async getMonitorRelations(user: ObjectId) {
    const relations = await this.monitors.readMany({ 
      $or: [{monitor:user}, {monitored: user}] 
    });
    return relations
  }

  async isMonitored(user: ObjectId, by: ObjectId) {
    console.log(user, by);
    const res = await this.monitors.readOne({monitor: by, monitored: user});
    console.log("Failed to find monitor relation.")
    if (res === null) {
      throw new MonitorNotFoundError(user, by);
    }
  }

  async notMonitored(user: ObjectId, by: ObjectId) {
    const res = await this.monitors.readOne({monitor: by, monitored: user});
    if (res !== null) {
      throw new MonitorAlreadyExistsError(user,by);
    }
  }
}

/////////////////////////////
// ERRORS
////////////////////////////
export class MonitorNotFoundError extends NotFoundError {
  constructor(
    public readonly user: ObjectId,
    public readonly monitor: ObjectId,
  ) {
    super("{1} isn't monitoring {0}!", user, monitor);
  }
}

export class MonitorAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly monitor: ObjectId,
  ) {
    super("{1} is already monitoring {0}!", user, monitor);
  }
}

export class MonitorRequestNotFoundError extends NotFoundError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Monitor request from {0} to {1} does not exist!", from, to);
  }
}

export class MonitorRequestAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Monitor request from {0} to {1} already exists!", from, to);
  }
}


