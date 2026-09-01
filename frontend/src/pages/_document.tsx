import Document, { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentContext } from 'next/document';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    // Forward the CSP nonce header from the response if present
    const nonce = ctx?.res?.getHeader('X-Content-Nonce') as string | undefined;
    return { ...initialProps, nonce };
  }

  render() {
    const nonce = (this.props as any).nonce as string | undefined;
    return (
      <Html>
        <Head>
          {nonce && <meta httpEquiv="csp-nonce" content={nonce} />}
        </Head>
        <body>
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}
