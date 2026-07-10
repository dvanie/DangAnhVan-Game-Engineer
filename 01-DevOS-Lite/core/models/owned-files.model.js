const OWNED_FILES_BY_FEATURE = {
    Tutorial: [
        "Assets/Scripts/Tutorial/TutorialStepController.cs",
        "Assets/Scripts/Tutorial/TutorialHintTrigger.cs",
        "Assets/Scripts/Tutorial/TutorialQuestPlaceholder.cs",
        "Assets/Scripts/Tutorial/TutorialEncounterMarker.cs",
        "Assets/Scripts/Tutorial/TutorialCompletionDropTracker.cs",
        "Assets/Scripts/Tutorial/TutorialObjectiveUI.cs"
    ],
    Summon: [
        "Assets/Scripts/Summon/"
    ],
    Army: [
        "Assets/Scripts/Army/"
    ],
    Soul: [
        "Assets/Scripts/Soul/"
    ],
    Runtime: [
        "Assets/Scripts/Runtime/"
    ]
};

const INTEGRATION_POINTS_BY_FEATURE = {
    Tutorial: [
        {
            feature: "Player",
            reason: "movement, run, and dash tutorial gates",
            files: ["Assets/Scripts/Player/PlayerMovement.cs"]
        },
        {
            feature: "Enemy",
            reason: "tutorial encounter completion through enemy defeat",
            files: ["Assets/Scripts/Enemy/EnemyHealth.cs"]
        },
        {
            feature: "Soul",
            reason: "soul drop, pickup, and extraction tutorial completion",
            files: ["Assets/Scripts/Soul/"]
        }
    ],
    Summon: [
        {
            feature: "Runtime",
            reason: "summon lifecycle checks and runtime spawn state",
            files: ["Assets/Scripts/Runtime/"]
        },
        {
            feature: "Army",
            reason: "assigned soul slots and active team composition",
            files: ["Assets/Scripts/Army/"]
        },
        {
            feature: "Soul",
            reason: "soul type/rank data used for summon identity",
            files: ["Assets/Scripts/Soul/"]
        }
    ],
    Army: [
        {
            feature: "Soul",
            reason: "owned souls determine available army slots",
            files: ["Assets/Scripts/Soul/"]
        },
        {
            feature: "Summon",
            reason: "assigned army slots are used for summon input",
            files: ["Assets/Scripts/Summon/"]
        },
        {
            feature: "Runtime",
            reason: "alive/cooldown state affects army availability",
            files: ["Assets/Scripts/Runtime/"]
        }
    ],
    Soul: [
        {
            feature: "Enemy",
            reason: "enemy defeat may create soul drops",
            files: ["Assets/Scripts/Enemy/EnemyHealth.cs"]
        },
        {
            feature: "Collection",
            reason: "collected souls are stored and synced with collection state",
            files: ["Assets/Scripts/Collection/"]
        },
        {
            feature: "Summon",
            reason: "soul type/rank becomes summonable identity",
            files: ["Assets/Scripts/Summon/"]
        }
    ],
    Runtime: [
        {
            feature: "Summon",
            reason: "spawn/recall/death lifecycle updates runtime state",
            files: ["Assets/Scripts/Summon/"]
        },
        {
            feature: "Army",
            reason: "runtime state controls alive/cooldown availability",
            files: ["Assets/Scripts/Army/"]
        },
        {
            feature: "GameManager",
            reason: "global tick/update may drive runtime cooldowns",
            files: ["Assets/Scripts/GameManager.cs"]
        }
    ]
};

function getOwnedFiles(featureName) {

    const key = Object.keys(OWNED_FILES_BY_FEATURE).find(feature =>
        feature.toLowerCase() === String(featureName || "").toLowerCase()
    );

    return key ? [...OWNED_FILES_BY_FEATURE[key]] : [];

}

function getIntegrationPoints(featureName) {

    const key = Object.keys(INTEGRATION_POINTS_BY_FEATURE).find(feature =>
        feature.toLowerCase() === String(featureName || "").toLowerCase()
    );

    return key
        ? INTEGRATION_POINTS_BY_FEATURE[key].map(point => ({
            ...point,
            files: [...(point.files || [])]
        }))
        : [];

}

function attachOwnedFiles(context) {

    if (!context || typeof context !== "object") {
        return context;
    }

    const existing = Array.isArray(context.ownedFiles)
        ? context.ownedFiles
        : [];
    const mapped = getOwnedFiles(context.feature);

    return {
        ...context,
        ownedFiles: unique([
            ...existing,
            ...mapped
        ])
    };

}

function attachFeatureIntelligence(context) {

    if (!context || typeof context !== "object") {
        return context;
    }

    const withOwnedFiles = attachOwnedFiles(context);
    const existing = Array.isArray(withOwnedFiles.integrationPoints)
        ? withOwnedFiles.integrationPoints
        : [];
    const mapped = getIntegrationPoints(withOwnedFiles.feature);

    return {
        ...withOwnedFiles,
        integrationPoints: uniqueIntegrationPoints([
            ...existing,
            ...mapped
        ])
    };

}

function uniqueIntegrationPoints(items) {

    const seen = new Set();

    return (items || []).filter(item => {
        const key = typeof item === "string"
            ? item
            : `${item.feature || ""}:${item.reason || ""}:${(item.files || []).join("|")}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });

}

function unique(items) {

    return [...new Set(items.filter(Boolean))];

}

module.exports = {
    getOwnedFiles,
    getIntegrationPoints,
    attachOwnedFiles,
    attachFeatureIntelligence
};
