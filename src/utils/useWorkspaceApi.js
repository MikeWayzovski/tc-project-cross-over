import { useState, useEffect } from 'react';
import * as Extensions from "trimble-connect-project-workspace-api";
import { Logger } from './logger';

export const useWorkspaceApi = () => {
  const [workspaceApi, setWorkspaceApi] = useState(null);
  const [embeddedToken, setEmbeddedToken] = useState(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  // NIEUW: State voor het actieve project
  const [embeddedProject, setEmbeddedProject] = useState(null); 

  useEffect(() => {
    const inIframe = window !== window.parent;
    setIsEmbedded(inIframe);

    if (!inIframe) return;

    const initWorkspace = async () => {
      try {
        const api = await Extensions.connect(
          window.parent,
          (event, args) => {
            if (event === "extension.command") {
              Logger.info(`Menu commando: ${args.data}`);
            } else if (event === "extension.accessToken") {
              setEmbeddedToken(args.data);
            }
          },
          30000
        );

        setWorkspaceApi(api);

        const mainMenuObject = {
          title: "Trimble Sand Box",
          icon: `${window.location.origin}/mijn-logo.svg`,
          command: "SANDBOX_MAIN_MENU"
        };
        await api.ui.setMenu(mainMenuObject);
        
        const token = await api.extension.getPermission("accesstoken");
        if (token) setEmbeddedToken(token);

        // NIEUW: Haal het huidige project op waarin de extensie draait!
        const projectInfo = await api.project.getCurrentProject();
        Logger.info("Huidig project opgehaald via Workspace API:", projectInfo);
        setEmbeddedProject(projectInfo);

      } catch (error) {
        Logger.error("Fout in Workspace API connectie:", error.message);
      }
    };

    initWorkspace();
  }, []);

  return { isEmbedded, workspaceApi, embeddedToken, embeddedProject };
};