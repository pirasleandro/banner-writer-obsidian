import { Plugin } from "obsidian";

import { PluginValue, ViewPlugin } from "@codemirror/view";
import { Banner, BannerType, IBanner } from "./banner";
import { BannerWriterSettingsTab } from "./settings-tab";

export const WEB_APP_URL = "https://banner-writer.web.app";
export const WEB_APP_IMAGE_URL = WEB_APP_URL + "/image";
export const WEB_APP_WRITE_URL = WEB_APP_URL + "?writing=";
export const BANNER_PLACEHOLDER_PATH = "../assets/banner-placeholder.png";

function toBannerUrl(code: string): string;
function toBannerUrl(banners: Banner[]): string;
function toBannerUrl(code_banners: string | Banner[]) {
  const code =
    typeof code_banners === "string"
      ? code_banners
      : Banner.join(...code_banners);
  const url = `${WEB_APP_IMAGE_URL}/${code}.png`;
  console.log("generated url:", url);
  return url;
}

export interface BannerWriterData {
  banners: IBanner[];
  tags: string[];
}

export interface BannerWriterSettings {
  banners: Banner[];
  tags: string[];
}

export const DEFAULT_SETTINGS: BannerWriterSettings = {
  banners: [],
  tags: [],
};

export default class BannerWriter extends Plugin {
  data: BannerWriterData;
  settings: BannerWriterSettings;

  getBannerImg(bannerNames: string[]): HTMLImageElement {
    const banners = bannerNames.map((name) => {
      return [...this.settings.banners].find((banner) => banner.name === name);
    });
    return createEl("img", {
      attr: {
        src: banners.every((banner) => !!banner)
          ? toBannerUrl(banners)
          : BANNER_PLACEHOLDER_PATH,
      },
    });
  }

  async onload() {
    await this.loadSettings();

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new BannerWriterSettingsTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    /* this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      console.log("click", evt);
    }); */

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
    );

    this.registerMarkdownPostProcessor((element, context) => {
      const codeblocks = element.findAll("code");

      for (const codeblock of codeblocks) {
        const text = codeblock.innerText.trim();
        if (!text.startsWith("B:")) return;
        const words = text.substring(2).split(" ").reverse();
        const bannerEmbed = this.getBannerImg(words);
        console.log(`created banner embed for code ${words}:`, bannerEmbed);
        codeblock.replaceWith(bannerEmbed);
      }
    });

    const editorExtension = ViewPlugin.fromClass(BannerWriterEditorExtension);
    this.registerEditorExtension(editorExtension);
  }

  onunload() {}

  async loadSettings() {
    this.data = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings = {
      banners: this.data.banners.map((banner) => new Banner(banner)),
      tags: this.data.tags,
    };
  }

  async saveSettings() {
    const banners = this.settings.banners.map((banner) => banner.export());

    const data: BannerWriterData = {
      banners,
      tags: this.settings.tags,
    };

    console.log("settings:", this.settings);

    console.log("save data:", data);

    await this.saveData(data);
  }
}

class BannerWriterEditorExtension implements PluginValue {}
