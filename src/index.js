const path = require("path");
const fs = require("fs");
const { parse } = require("node-html-parser");

console.log("----------");
const main = async () => {
  const currentDir =
    path.dirname(process.cwd()) + "/" + path.basename(process.cwd());
  const sourceDir = currentDir + "/src";
  const componentsDir = sourceDir + "/components";

  const componentsDirectory = await fs.promises.readdir(componentsDir, {
    withFileTypes: true,
  });
  const [directories, components] = componentsDirectory.reduce(
    (acc, dirent) => {
      if (dirent.isDirectory()) {
        acc[0].push(dirent);
      } else {
        acc[1].push(dirent);
      }
      return acc;
    },
    [[], []]
  );

  const componentsHtmls = await Promise.all(
    components.map(async (comp) => {
      const file = await fs.promises.readFile(
        componentsDir + "/" + comp.name,
        "utf8"
      );
      return { name: comp.name.split(".")[0], html: parse(file) };
    })
  );
  const componentNames = components.map((i) => i.name.split(".")[0]);

  const indexFile = await fs.promises.readFile(
    sourceDir + "/index.html",
    "utf8"
  );

  const styles = await fs.promises.readFile(sourceDir + "/styles.css", "utf8");
  const stylesElement = parse(`<style>${styles}</style>`);

  const index = parse(indexFile);
  index.querySelector("head").appendChild(stylesElement);

  componentNames.forEach((name) => {
    const componentSpot = index.querySelector(`#${name.toLowerCase()}`);
    if (!componentSpot) {
      console.warn(`Component ${name}, not used`);
      return;
    }
    const componentHtml = componentsHtmls.find((i) => i.name === name);
    if (!componentHtml) {
      console.error(`Component ${name}, not found`);
      return;
    }
    const componentWrapper = parse("<main><div></div></main>");
    componentWrapper.querySelector("div").appendChild(componentHtml.html);
    componentSpot.appendChild(componentWrapper);
  });
  await fs.promises.writeFile(
    currentDir + "/dist/index.html",
    index.toString()
  );
};

main();
