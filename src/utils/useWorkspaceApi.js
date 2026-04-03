import { useState, useEffect } from 'react';
import * as Extensions from "trimble-connect-project-workspace-api";
import { Logger } from './logger';

export const useWorkspaceApi = () => {
  const [workspaceApi, setWorkspaceApi] = useState(null);
  const [embeddedToken, setEmbeddedToken] = useState(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Simpele check: draaien we in een Iframe (Trimble Connect) of als losse site?
    const inIframe = window !== window.parent;
    setIsEmbedded(inIframe);

    if (!inIframe) return; // Stop als we niet in Trimble Connect zitten

    const initWorkspace = async () => {
      try {
        // 1. Maak connectie met de parent window (Trimble Connect)
        const api = await Extensions.connect(
          window.parent,
          (event, args) => {
            if (event === "extension.command") {
              Logger.info(`Menu commando ontvangen: ${args.data}`);
            } else if (event === "extension.accessToken") {
              setEmbeddedToken(args.data);
            }
          },
          30000
        );

        setWorkspaceApi(api);

        // 2. Stel het linkermenu in met jouw eigen logo!
        const mainMenuObject = {
          title: "Trimble Sand Box",
          icon: `${window.location.origin}/mijn-logo.svg`, // Zorg dat dit bestand in je public map staat
          command: "SANDBOX_MAIN_MENU"
        };
        
        await api.ui.setMenu(mainMenuObject);
        Logger.success("Workspace API verbonden en menu ingesteld.");

        // 3. Vraag direct het access token op zonder opnieuw in te loggen
        const token = await api.extension.getPermission("accesstoken");
        if (token) {
          setEmbeddedToken(token);
          Logger.success("Embedded Access Token succesvol ontvangen.");
        }

      } catch (error) {
        Logger.error("Kon niet verbinden met Trimble Workspace API", error.message);
      }
    };

    initWorkspace();
  }, []);

  return { isEmbedded, workspaceApi, embeddedToken };
};