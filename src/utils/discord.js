const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

export async function sendDiscordNotification(project, isUpdate = false) {
    const embed = {
        embeds: [{
            title: `${isUpdate ? 'Project Update Request' : 'New Project Submission'}: ${project.name}`,
            color: isUpdate ? 0xF59E0B : 0x00E5FF,
            thumbnail: { url: project.logoUrl || "" },
            fields: [
                { name: "Project Name", value: project.name, inline: true },
                { name: "Category", value: project.category, inline: true },
                { name: "Status", value: project.status, inline: true },
                { name: "One-liner", value: project.shortDesc, inline: false },
                {
                    name: "Description",
                    value: project.fullDesc ? (project.fullDesc.substring(0, 500) + (project.fullDesc.length > 500 ? "..." : "")) : 'None',
                    inline: false
                },
                { name: "Tags", value: project.tags && project.tags.length ? project.tags.join(", ") : "None", inline: true },
                { name: "Key Metric", value: `${project.metricLabel}: ${project.metricValue}`, inline: true },
                { name: "Website", value: project.website || "Not provided", inline: true },
                { name: "Twitter/X", value: project.twitter || "Not provided", inline: true },
                { name: "Discord", value: project.discord || "Not provided", inline: true },
                { name: "GitHub", value: project.github || "Not provided", inline: true },
                { name: "Submitted By", value: `\`${project.walletAddress}\``, inline: true },
                { name: "Wallet Type", value: project.walletType ? project.walletType.toUpperCase() : 'UNKNOWN', inline: true },
                {
                    name: "Logo URL",
                    value: project.logoUrl
                        ? `[View Logo](${project.logoUrl})`
                        : "No logo uploaded",
                    inline: false
                },
            ],
            footer: {
                text: `${isUpdate ? 'Updated' : 'Submitted'} ${new Date().toLocaleString()} • Republic Economy Explorer`
            },
            timestamp: new Date().toISOString()
        }],
        content: `@here ${isUpdate ? 'Project update awaits' : 'New project submission awaiting review'}! ID: \`${project.id}\``
    };

    try {
        const res = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embed)
        });

        if (!res.ok) {
            console.warn("Failed to send Discord notification", await res.text());
        }
    } catch (err) {
        console.warn("Discord webhook error:", err);
    }
}

export async function sendAdminApproveNotification(project) {
    const embed = {
        embeds: [{
            title: `✅ Project Approved: ${project.name}`,
            color: 0x00FF6F,
            thumbnail: { url: project.logoUrl || "" },
            fields: [
                { name: "Project", value: project.name, inline: true },
                { name: "Category", value: project.category || "N/A", inline: true },
                { name: "Status", value: project.status || "Live", inline: true },
                { name: "Website", value: project.website || "Not provided", inline: true },
                { name: "Submitted By", value: `\`${project.walletAddress}\``, inline: false },
            ],
            footer: { text: `Approved at ${new Date().toLocaleString()} • Republic Economy Explorer` },
            timestamp: new Date().toISOString()
        }],
        content: `🚀 A new project **${project.name}** has been **approved** and is now live on the Explorer!`
    };
    try {
        const res = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embed)
        });
        if (!res.ok) console.warn("Discord approve notify failed", await res.text());
    } catch (err) {
        console.warn("Discord webhook error:", err);
    }
}

export async function sendAdminDeclineNotification(project) {
    const embed = {
        embeds: [{
            title: `❌ Project Declined: ${project.name}`,
            color: 0xFF3B5C,
            thumbnail: { url: project.logoUrl || "" },
            fields: [
                { name: "Project", value: project.name, inline: true },
                { name: "Category", value: project.category || "N/A", inline: true },
                { name: "Submitted By", value: `\`${project.walletAddress}\``, inline: false },
            ],
            footer: { text: `Deleted at ${new Date().toLocaleString()} • Republic Economy Explorer` },
            timestamp: new Date().toISOString()
        }],
        content: `🗑️ Project **${project.name}** submitted by \`${project.walletAddress}\` has been **declined and deleted** from the database.`
    };
    try {
        const res = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embed)
        });
        if (!res.ok) console.warn("Discord decline notify failed", await res.text());
    } catch (err) {
        console.warn("Discord webhook error:", err);
    }
}
