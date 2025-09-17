declare global {
  interface Window {
    gapi: {
      load: (apis: string, callback: () => void) => void;
      auth2: {
        init: (options: { client_id: string }) => Promise<any>;
        getAuthInstance: () => {
          isSignedIn: {
            get: () => boolean;
          };
          signIn: () => Promise<any>;
          currentUser: {
            get: () => {
              getAuthResponse: () => {
                access_token: string;
              };
            };
          };
        };
      };
    };
    google: {
      picker: {
        PickerBuilder: new () => {
          addView: (view: any) => any;
          setOAuthToken: (token: string) => any;
          setDeveloperKey: (key: string) => any;
          setCallback: (callback: (data: any) => void) => any;
          setTitle: (title: string) => any;
          build: () => {
            setVisible: (visible: boolean) => void;
          };
        };
        ViewId: {
          PHOTOS: any;
          DOCS_IMAGES: any;
        };
        DocsView: new (viewId: any) => any;
        Action: {
          PICKED: string;
        };
      };
    };
  }
}

export {};