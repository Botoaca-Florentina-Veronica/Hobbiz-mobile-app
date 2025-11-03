declare module 'react-native-webview' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface WebViewProps extends ViewProps {
    source?: { uri?: string; html?: string };
    originWhitelist?: string[];
    startInLoadingState?: boolean;
    style?: any;
  }

  export class WebView extends React.Component<WebViewProps> {}
  export default WebView;
}
