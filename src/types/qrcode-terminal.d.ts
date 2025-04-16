declare module 'qrcode-terminal' {
    interface QRCodeOptions {
        small?: boolean;
    }

    function generate(text: string, options?: QRCodeOptions): void;
    function setErrorLevel(errorLevel: string): void;

    export = {
        generate,
        setErrorLevel
    };
}
