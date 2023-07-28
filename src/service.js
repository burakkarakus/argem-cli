import axios from "axios";
import { readData } from "./helper.js";

class ArgemService {
  constructor() {
    this.baseURL = "https://argem-sancaktepe.hepsiburada.com/api";
    this.init();
  }

  init = () => {
    const data = readData();
    this.instance = null;

    this.instance = axios.create({
      headers: {
        Authorization: `Bearer ${data?.token}`,
        Cookie: data?.Cookie,
      },
      validateStatus: (status) =>
        status >= 200 && status <= 500 && status !== 401 && status !== 400,
      baseURL: this.baseURL,
    });
  };

  login = (email, password) => {
    return this.instance.post("/auth/sign_in", { email, password });
  };

  getTimeTable = () => {
    return this.instance.post("/", {
      query: "GetAllPersonalWorklogs",
      payload: { filter: [], sorting: [] },
    });
  };

  getActivities = () => {
    return this.instance.post("/", {
      query: "ActivitySelectList",
      payload: { label: "", wid: "" },
    });
  };

  getProjects = () => {
    return this.instance.post("/", {
      query: "ProjectSelectListByTeam",
      payload: { label: "2023-07-19", wid: 966406 },
    });
  };

  enterWorklog = (id, activity, project, total_time) => {
    return this.instance.post("/", {
      query: "updateWorklogDetail",
      payload: {
        data: [
          {
            item_status: "1",
            activity,
            project,
            holiday: null,
            total_time,
            statement: null,
          },
        ],
        id,
      },
    });
  };
}

export default new ArgemService();
