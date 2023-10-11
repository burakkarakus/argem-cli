import axios from "axios";
import { readData } from "./helper.js";

class ArgemService {
  constructor() {
    this.baseURL = "https://argem-sancaktepe.hepsiburada.com/api";
    this.init();
  }

  init = () => {
    try {
      const { authToken } = readData();
      this.instance = null;

      this.instance = axios.create({
        headers: {
          Cookie: `next-auth.session-token=${authToken}`,
        },
        validateStatus: (status) =>
          status >= 200 && status <= 500 && status !== 401 && status !== 400,
        baseURL: this.baseURL,
      });
    } catch (error) {}
  };

  getTimeTable = () => {
    return this.instance.get("/worklogs", {
      params: { type: "user", page: 1 },
    });
  };

  getActivities = (date, wid) => {
    return this.instance.get("/worklogs/projects", {
      params: {
        wid,
        date: date.substring(0, 10),
      },
    });
  };

  getProjects = () => {
    return this.instance.get("/lookups");
  };

  enterWorklog = (wid, date, activity, project, time) => {
    return this.instance.post(
      "/worklogs",
      {
        activity,
        project,
        time,
        type: "OUTSIDE",
      },
      { params: { wid, date: date.substring(0, 10) } }
    );
  };
}

export default new ArgemService();
