import DocCollection, { BaseDoc } from "../framework/doc";
import { ObjectId } from "mongodb";
import { Feature } from "./timeRestrictions";

export interface ScreenTimeDoc extends BaseDoc {
    user: ObjectId;
    feature: Feature;
    timeUsed: number;
}

export default class ScreenTimeConcept {
    public readonly screenTime = new DocCollection<ScreenTimeDoc>("screenTime");


    async setTimeUsed(user: ObjectId, feature: Feature) {

    }
    
    async getTimeUsed(user: ObjectId, feature: Feature) {

    }
}