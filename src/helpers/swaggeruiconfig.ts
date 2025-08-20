import fs from "fs"
import path from "path"
import { VERSION_PREFIX } from "../constants"

type LogoConfig = {
    type: string
    content: Buffer
}

type InfoConfig = {
    title: string
    description: string
    version: string
}

type ThemeConfig = {
    css: Array<{
        filename: string
        content: string
    }>
    favicon: Array<{
        filename: string
        rel: string
        sizes: string
        type: string
        content: Buffer
    }>
}

// logo is a base64 encoded image
const encodedLogo = fs.readFileSync(
    path.resolve(
        __dirname,
        "../public-assets/swagger-ui-assets/true-fit.png",
    ),
    "base64",
)

/**
 * returns the info config for the swagger ui
 * @returns InfoConfig
 */
export function getInfoConfig(): InfoConfig {
    return {
        title: "True Fit App",
        description:
            "An interactive overview of all API endpoints related to the True Fit .",
        version: VERSION_PREFIX,
    }
}

/**
 * returns the logo config for the swagger ui
 * @returns LogoConfig
 */
export function getLogoConfig(): LogoConfig {
    const logoConfig = {
        type: "image/png",
        content: Buffer.from(encodedLogo, "base64"),
    }
    return logoConfig
}

/**
 * returns the theme config for the swagger ui
 * @returns ThemeConfig
 */
export function getThemeConfig(): ThemeConfig {
    return {
        css: [
            {
                filename: "theme.css",
                content: "* { .download-url-wrapper { visibility: hidden; } }",
            },
        ],
        favicon: [
            {
                filename: "logo_with_text.png",
                rel: "icon",
                sizes: "16x16",
                type: "image/png",
                content: Buffer.from(encodedLogo, "base64"),
            },
        ],
    }
}
