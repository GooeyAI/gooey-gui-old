import { JsonViewer } from "@textea/json-viewer";

export default () => {
  return (
    <>
      <div id="some-extension-element" />
      <JsonViewer value={{ hello: "world" }} />
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <script>
                document.getElementById("some-extension-element").innerHTML = "Hello from an extension!";
            </script>
            `,
        }}
      />
    </>
  );
};
