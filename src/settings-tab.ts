import {
  PluginSettingTab,
  App,
  TextComponent,
  ButtonComponent,
  ExtraButtonComponent,
  Setting,
  Menu,
  DropdownComponent,
} from "obsidian";
import { Banner, BannerType, IBanner } from "./banner";
import BannerWriter from "./main";

export class BannerWriterSettingsTab extends PluginSettingTab {
  plugin: BannerWriter;
  webApp: HTMLIFrameElement = createEl("iframe", {
    attr: {
      src: "https://banner-writer.web.app",
      style: "width: 100%; min-height: 400px;",
      allow: "clipboard-read; clipboard-write",
    },
  });
  bannerSettings = new WeakMap<
    Banner,
    { item: HTMLDivElement; preview: HTMLImageElement }
  >();
  defaultBannerType: BannerType = BannerType.None;

  constructor(app: App, plugin: BannerWriter) {
    super(app, plugin);
    this.plugin = plugin;
  }

  loadBanner(banner: Banner) {
    console.log("load", banner.writeUrl);
    this.webApp.src = banner.writeUrl;
  }

  addSettingItem(banner: Banner) {
    const preview = banner.toImg();
    const item = createEl("div", {
      cls: "setting-item-control banner-row",
      attr: { style: "justify-content: start" },
    });
    // item.appendChild(createEl("code", { cls: "banner-number" }));
    new TextComponent(item).setValue(banner.name).onChange(async (value) => {
      banner.name = value;
      await this.plugin.saveSettings();
    });
    new DropdownComponent(item)
      .addOptions(BannerType)
      .setValue(banner.type)
      .onChange(async (value) => {
        if (value === "") banner.type = BannerType.None;
        else banner.type = value as BannerType;
        await this.plugin.saveSettings();
        console.log("bannerType:", banner.type);
      });
    new ButtonComponent(item).setButtonText("Paste").onClick(async () => {
      const text = await navigator.clipboard.readText();
      console.log("pasted:", text);
      // banner.imageUrl = text;
      const newCode = text.split("/").last()?.slice(0, -4);
      if (newCode) {
        banner.code = newCode;
        await this.plugin.saveSettings();
        preview.src = banner.imageUrl;
      }
    });
    new ButtonComponent(item).setButtonText("Load").onClick(async () => {
      this.loadBanner(banner);
    });
    /* new TextComponent(item).setValue(banner.code).onChange(async (value) => {
      banner.code = value;
      preview.src = toBannerUrl(value);
      await this.plugin.saveSettings();
    }); */
    item.appendChild(preview);
    // new ExtraButtonComponent(item).setIcon("up-chevron-glyph");
    // new ExtraButtonComponent(item).setIcon("down-chevron-glyph");
    new ExtraButtonComponent(item)
      .setIcon("minus-with-circle")
      .onClick(async () => {
        await this.removeSettingsItem(banner);
      });

    this.containerEl.appendChild(item);

    this.bannerSettings.set(banner, { item, preview });
  }

  async removeSettingsItem(banner: Banner) {
    this.bannerSettings.get(banner)?.item.remove();
    this.bannerSettings.delete(banner);
    this.plugin.settings.banners.splice(
      this.plugin.settings.banners.indexOf(banner),
      1
    );
    await this.plugin.saveSettings();
  }

  createBannerSettings(filter?: (banner: Banner) => boolean) {
    this.plugin.settings.banners.forEach((banner, i) => {
      if (filter && !filter(banner)) return;
      this.addSettingItem(banner);
    });
  }

  /* updateBannerSettings() {
    this.bannerSettings.forEach(({ banner, setting, preview }) => {
      preview.src = toBannerUrl(banner.name);
    });
  } */

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl).setHeading().setName("Banner Editor");

    containerEl.appendChild(this.webApp);

    new Setting(containerEl)
      .setHeading()
      .setName("Banners")
      .addButton((btn) => {
        btn.setButtonText("Add Banner").onClick(async () => {
          const banner = new Banner(
            `Banner-${this.plugin.settings.banners.length}`,
            (await navigator.clipboard.readText()) ?? "L.",
            this.defaultBannerType ?? BannerType.None
          );
          this.plugin.settings.banners.push(banner);
          await this.plugin.saveSettings();
          this.addSettingItem(banner);
        });
      })
      .addDropdown((dropdown) => {
        dropdown.addOption("", "All");
        dropdown.addOptions(BannerType).onChange((value) => {
          containerEl
            .querySelectorAll(".banner-row")
            .forEach((row) => row.remove());
          if (value === "") {
            this.createBannerSettings();
          } else {
            this.createBannerSettings((banner) => banner.type === value);
            this.defaultBannerType = value as BannerType;
          }
        });
      })
      .addSearch((search) => {
        search.onChange((value) => {
          containerEl
            .querySelectorAll(".banner-row")
            .forEach((row) => row.remove());
          this.createBannerSettings((banner) =>
            banner.name.toLocaleLowerCase().includes(value.toLocaleLowerCase())
          );
        });
      });

    this.createBannerSettings();
  }
}
