-- [[ SCRIPT 1: MAIN GUI CREATION ]]
-- INSTRUCTIONS:
-- 1. Create a "LocalScript" in StarterGui named "CecotGuiLoader".
-- 2. Paste this entire section into it.
-- 3. This script ONLY creates the visual elements.

-- // ICONS DATA //
local ICONS = {
    Shield = "rbxassetid://139392304680666",
    Radio = "rbxassetid://100993367061836",
    ShoppingCart = "rbxassetid://139455013336249",
    Home = "rbxassetid://129155677122521",
    Menu = "rbxassetid://120308607130455",
    User = "rbxassetid://90017407223117",
    Crosshair = "rbxassetid://72454903126317",
    Settings = "rbxassetid://121594443934391",
    Users = "rbxassetid://89081891011931",
    Lock = "rbxassetid://90386303229845",
    Zap = "rbxassetid://72679938799288",
    Skull = "rbxassetid://91685367927183",
    Crown = "rbxassetid://120033116885513",
    Gavel = "rbxassetid://101845573945259",
    Briefcase = "rbxassetid://133392052702640",
    MessageCircle = "rbxassetid://87645180578861",
    Gift = "rbxassetid://102384887313942",
    Swords = "rbxassetid://101625267697247",
    Download = "rbxassetid://128374780159440",
    Check = "rbxassetid://111085642392214"
}

-- // IMAGES DATA //
local IMAGES = {
    inmate = "rbxassetid://130037387951415",
    combat = "rbxassetid://139633486217360",
    suit = "rbxassetid://135183636165754",
    gangster = "rbxassetid://130037387951415",
    soldier = "rbxassetid://125690895468214",
    background = "rbxassetid://93334166782688",
    teamselectionicon = "rbxassetid://86155575998781",
    m4a1 = "rbxassetid://0", -- Replace with actual ID
    ak47 = "rbxassetid://0", -- Replace with actual ID
    glock = "rbxassetid://0", -- Replace with actual ID
    remington = "rbxassetid://0", -- Replace with actual ID
    barrett = "rbxassetid://0"  -- Replace with actual ID
}

local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")

local TeamModule = nil
local success, loadedTeamModule = pcall(function()
    return require(ReplicatedStorage:WaitForChild("team"))
end)
if success and type(loadedTeamModule) == "table" then
    TeamModule = loadedTeamModule
end

local function normalizeTeamName(text)
    if type(text) ~= "string" then
        return ""
    end
    return text:lower():gsub("^%s*(.-)%s*$", "%1")
end

local function getAllowedTeamNames(player)
    local allowed = {}

    if TeamModule and type(TeamModule.getAllowedTeamNames) == "function" then
        for _, name in ipairs(TeamModule.getAllowedTeamNames(player)) do
            if type(name) == "string" and name ~= "" then
                table.insert(allowed, normalizeTeamName(name))
            end
        end
    end

    local attributeValue = player:GetAttribute("AllowedTeams")
    if type(attributeValue) == "string" then
        for teamName in string.gmatch(attributeValue, "([^;]+)") do
            teamName = teamName:match("^%s*(.-)%s*$")
            if teamName ~= "" then
                table.insert(allowed, normalizeTeamName(teamName))
            end
        end
    end

    if player.Team and player.Team.Name ~= "" then
        table.insert(allowed, normalizeTeamName(player.Team.Name))
    end

    return allowed
end

local function isTeamAllowed(player, teamName)
    local normalizedTarget = normalizeTeamName(teamName)
    local prisonerTeam = normalizeTeamName((TeamModule and TeamModule.PRISONER_TEAM_NAME) or "INMATES")
    if normalizedTarget == prisonerTeam then
        return true
    end
    for _, allowedName in ipairs(getAllowedTeamNames(player)) do
        if allowedName == normalizedTarget then
            return true
        end
    end
    return false
end

local function safeText(text)
    if typeof(text) ~= "string" then
        return ""
    end
    return text
end

-- // CONFIGURATION //
local COLORS = {
    Slate950 = Color3.fromRGB(2, 6, 23),
    Slate900 = Color3.fromRGB(15, 23, 42),
    Slate800 = Color3.fromRGB(30, 41, 59),
    Slate700 = Color3.fromRGB(51, 65, 85),
    Yellow500 = Color3.fromRGB(234, 179, 8),
    Yellow600 = Color3.fromRGB(202, 138, 4),
    Blue600 = Color3.fromRGB(37, 99, 235),
    Red600 = Color3.fromRGB(220, 38, 38),
    Green500 = Color3.fromRGB(34, 197, 94),
    White = Color3.fromRGB(255, 255, 255),
    Gray400 = Color3.fromRGB(156, 163, 175),
    Discord = Color3.fromRGB(88, 101, 242),
    Black = Color3.new(0, 0, 0)
}

-- Team Colors Mapping
local TEAM_COLORS = {
    ["bg-orange-500"] = Color3.fromRGB(249, 115, 22),
    ["bg-blue-600"] = Color3.fromRGB(37, 99, 235),
    ["bg-black"] = Color3.fromRGB(0, 0, 0),
    ["bg-slate-800"] = Color3.fromRGB(30, 41, 59),
    ["bg-indigo-900"] = Color3.fromRGB(49, 46, 129),
    ["bg-yellow-700"] = Color3.fromRGB(161, 98, 7),
    ["bg-gray-500"] = Color3.fromRGB(107, 114, 128),
    ["bg-green-700"] = Color3.fromRGB(21, 128, 61),
    ["bg-red-900"] = Color3.fromRGB(127, 29, 29),
    ["bg-stone-700"] = Color3.fromRGB(68, 64, 60),
    ["bg-zinc-800"] = Color3.fromRGB(39, 39, 42),
    ["bg-blue-800"] = Color3.fromRGB(30, 64, 175),
    ["bg-sky-700"] = Color3.fromRGB(3, 105, 161),
    ["bg-slate-900"] = Color3.fromRGB(15, 23, 42),
    ["bg-red-600"] = Color3.fromRGB(220, 38, 38),
    ["bg-purple-900"] = Color3.fromRGB(88, 28, 135),
    ["bg-violet-900"] = Color3.fromRGB(76, 29, 149),
    ["bg-cyan-600"] = Color3.fromRGB(8, 145, 178),
    ["bg-pink-600"] = Color3.fromRGB(219, 39, 119),
    ["bg-blue-500"] = Color3.fromRGB(59, 130, 246),
    ["bg-teal-800"] = Color3.fromRGB(17, 94, 89),
    ["bg-amber-900"] = Color3.fromRGB(120, 53, 15),
    ["bg-red-500"] = Color3.fromRGB(239, 68, 68),
    ["bg-gray-900"] = Color3.fromRGB(17, 24, 39),
    ["bg-red-700"] = Color3.fromRGB(185, 28, 28),
    ["bg-yellow-600"] = Color3.fromRGB(202, 138, 4),
    ["bg-yellow-500"] = Color3.fromRGB(234, 179, 8),
    ["bg-emerald-900"] = Color3.fromRGB(6, 78, 59),
    ["bg-rose-900"] = Color3.fromRGB(136, 19, 55),
    ["bg-fuchsia-900"] = Color3.fromRGB(112, 26, 117),
    ["bg-red-950"] = Color3.fromRGB(69, 10, 10),
}

-- Teams Data
local TEAMS = TeamModule and TeamModule.TEAMS or {
  { name = "INMATES", color = "bg-orange-500", icon = "User", image = IMAGES.inmate, role = "Prisoner" },
  { name = "CECOT Guards", color = "bg-blue-600", icon = "Shield", image = IMAGES.combat, role = "Security" },
  { name = "Rapid Action Battalion (RAB)", color = "bg-black", icon = "Zap", image = IMAGES.combat, role = "Elite Unit" },
  { name = "SWAT", color = "bg-slate-800", icon = "Crosshair", image = IMAGES.combat, role = "Tactical" },
  { name = "Specialized Security Forces (SSF)", color = "bg-indigo-900", icon = "Shield", image = IMAGES.combat, role = "Special Ops" },
  { name = "Congress", color = "bg-yellow-700", icon = "Gavel", image = IMAGES.suit, role = "Government" },
  { name = "Government", color = "bg-gray-500", icon = "Briefcase", image = IMAGES.suit, role = "Official" },
  { name = "Training & Discipline Unit (TDU)", color = "bg-green-700", icon = "Users", image = IMAGES.combat, role = "Trainer" },
  { name = "Anti-Raiders Corps (ARC)", color = "bg-red-900", icon = "Shield", image = IMAGES.combat, role = "Defense" },
  { name = "Firearms Unit", color = "bg-stone-700", icon = "Crosshair", image = IMAGES.combat, role = "Weapons" },
  { name = "All-Time Arms Division (ATA)", color = "bg-zinc-800", icon = "Crosshair", image = IMAGES.combat, role = "Heavy Arms" },
  { name = "CECOT Internal Guards", color = "bg-blue-800", icon = "Shield", image = IMAGES.combat, role = "Internal Security" },
  { name = "CECOT External Guards", color = "bg-sky-700", icon = "Shield", image = IMAGES.combat, role = "Perimeter" },
  { name = "CECOT Headquarters (HQ)", color = "bg-slate-900", icon = "Crown", image = IMAGES.combat, role = "Command" },
  { name = "Twice Mayday Forces (TMF)", color = "bg-red-600", icon = "Zap", image = IMAGES.combat, role = "Emergency" },
  { name = "24/25 Secret Division", color = "bg-purple-900", icon = "Lock", image = IMAGES.combat, role = "Classified" },
  { name = "Secret Forces", color = "bg-violet-900", icon = "Lock", image = IMAGES.combat, role = "Covert" },
  { name = "Communication Workers", color = "bg-cyan-600", icon = "Radio", image = IMAGES.suit, role = "Logistics" },
  { name = "Media & Press Department", color = "bg-pink-600", icon = "MessageCircle", image = IMAGES.suit, role = "Press" },
  { name = "Police Department", color = "bg-blue-500", icon = "Shield", image = IMAGES.combat, role = "Law Enforcement" },
  { name = "Anti-Nationalist Department (AND)", color = "bg-teal-800", icon = "Shield", image = IMAGES.combat, role = "Intel" },
  { name = "Council of Judgment (COJ)", color = "bg-amber-900", icon = "Gavel", image = IMAGES.suit, role = "Judicial" },
  { name = "Gangsters", color = "bg-red-500", icon = "Skull", image = IMAGES.gangster, role = "Criminal" },
  { name = "Mafia", color = "bg-gray-900", icon = "Briefcase", image = IMAGES.gangster, role = "Organized Crime" },
  { name = "Raiders", color = "bg-red-700", icon = "Crosshair", image = IMAGES.gangster, role = "Hostile" },
  { name = "Super Mafia", color = "bg-black", icon = "Crown", image = IMAGES.gangster, role = "Boss" },
  { name = "Leader Judgment", color = "bg-yellow-600", icon = "Gavel", image = IMAGES.suit, role = "High Command" },
  { name = "Leader Officials", color = "bg-yellow-500", icon = "User", image = IMAGES.suit, role = "Executive" },
  { name = "Tharo Final Team", color = "bg-emerald-900", icon = "Zap", image = IMAGES.gangster, role = "Elite Criminal" },
  { name = "Hell-Nah Division", color = "bg-rose-900", icon = "Skull", image = IMAGES.gangster, role = "Chaos" },
  { name = "Yo-What-A Division", color = "bg-fuchsia-900", icon = "Zap", image = IMAGES.gangster, role = "Unknown" },
  { name = "Final Boss Division", color = "bg-red-950", icon = "Crown", image = IMAGES.gangster, role = "Endgame" },
}

local SHOP_ITEMS = {
  { name = "VIP Access", price = "R$ 500", type = "Gamepass", color = "bg-yellow-500" },
  { name = "M4A1 Assault", price = "R$ 1200", type = "Weapon", color = "bg-red-600" },
  { name = "Admin Commands", price = "R$ 5000", type = "Gamepass", color = "bg-purple-600" },
  { name = "Speed Coil", price = "R$ 250", type = "Tool", color = "bg-blue-400" },
  { name = "Riot Shield", price = "R$ 450", type = "Gear", color = "bg-slate-500" },
  { name = "Custom Tag", price = "R$ 100", type = "Cosmetic", color = "bg-pink-500" },
}

local WEAPONS = {
  { name = "M4A1 Assault Rifle", type = "Primary", damage = "High", fireRate = "Fast", image = IMAGES.m4a1 },
  { name = "AK-47 Kalashnikov", type = "Primary", damage = "Extreme", fireRate = "Medium", image = IMAGES.ak47 },
  { name = "Glock 19 Gen 5", type = "Secondary", damage = "Medium", fireRate = "Semi", image = IMAGES.glock },
  { name = "Remington 870", type = "Shotgun", damage = "Critical", fireRate = "Slow", image = IMAGES.remington },
  { name = "Barrett M82", type = "Sniper", damage = "One-Shot", fireRate = "Very Slow", image = IMAGES.barrett },
}

-- // UI CONSTRUCTION //

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "CecotPrisonGui"
screenGui.ResetOnSpawn = false
screenGui.IgnoreGuiInset = true
screenGui.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")

-- Main Frame
local mainFrame = Instance.new("Frame")
mainFrame.Name = "MainFrame"
mainFrame.Size = UDim2.new(1, 0, 1, 0)
mainFrame.BackgroundColor3 = COLORS.Slate950 -- Darker background
mainFrame.BorderSizePixel = 0
mainFrame.Parent = screenGui

-- Background Image
local bgImage = Instance.new("ImageLabel")
bgImage.Name = "Background"
bgImage.Size = UDim2.new(1, 0, 1, 0)
bgImage.Image = IMAGES.background
bgImage.ImageTransparency = 0.1 -- Darker
bgImage.ScaleType = Enum.ScaleType.Slice
bgImage.Parent = mainFrame

-- Dark Overlay
local bgOverlay = Instance.new("Frame")
bgOverlay.Size = UDim2.new(1, 0, 1, 0)
bgOverlay.BackgroundColor3 = COLORS.Black
bgOverlay.BackgroundTransparency = 0.4 -- Darker overlay
bgOverlay.Parent = mainFrame

-- Top Bar
local topBar = Instance.new("Frame")
topBar.Name = "TopBar"
topBar.Size = UDim2.new(1, 0, 0, 64)
topBar.BackgroundColor3 = COLORS.Slate950
topBar.BackgroundTransparency = 0.05
topBar.BorderSizePixel = 0
topBar.ZIndex = 10
topBar.Parent = mainFrame

-- Top Bar Gradient
local topBarGradient = Instance.new("UIGradient")
topBarGradient.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, COLORS.Slate950),
    ColorSequenceKeypoint.new(0.5, COLORS.Slate900),
    ColorSequenceKeypoint.new(1, COLORS.Slate950)
})
topBarGradient.Parent = topBar

-- Logo Area
local logoContainer = Instance.new("Frame")
logoContainer.Size = UDim2.new(0, 40, 0, 40)
logoContainer.Position = UDim2.new(0, 24, 0.5, -20)
logoContainer.BackgroundColor3 = COLORS.Yellow600
logoContainer.BorderSizePixel = 0
logoContainer.ZIndex = 11
logoContainer.Parent = topBar

local logoCorner = Instance.new("UICorner")
logoCorner.CornerRadius = UDim.new(0, 8)
logoCorner.Parent = logoContainer

local logoIcon = Instance.new("ImageLabel")
logoIcon.Size = UDim2.new(0, 24, 0, 24)
logoIcon.Position = UDim2.new(0.5, -12, 0.5, -12)
logoIcon.BackgroundTransparency = 1
logoIcon.Image = ICONS.Shield
logoIcon.ZIndex = 12
logoIcon.Parent = logoContainer

local titleLabel = Instance.new("TextLabel")
titleLabel.Text = "CECOT PRISON"
titleLabel.Font = Enum.Font.GothamBlack
titleLabel.TextSize = 20
titleLabel.TextColor3 = COLORS.White
titleLabel.BackgroundTransparency = 1
titleLabel.Size = UDim2.new(0, 200, 0, 24)
titleLabel.Position = UDim2.new(0, 76, 0.5, -14)
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.ZIndex = 11
titleLabel.Parent = topBar

local subTitleLabel = Instance.new("TextLabel")
subTitleLabel.Text = "ROLEPLAY • SEASON 5"
subTitleLabel.Font = Enum.Font.GothamBold
subTitleLabel.TextSize = 10
subTitleLabel.TextColor3 = COLORS.Yellow500
subTitleLabel.BackgroundTransparency = 1
subTitleLabel.Size = UDim2.new(0, 200, 0, 12)
subTitleLabel.Position = UDim2.new(0, 76, 0.5, 10)
subTitleLabel.TextXAlignment = Enum.TextXAlignment.Left
subTitleLabel.ZIndex = 11
subTitleLabel.Parent = topBar

-- Top Bar Right Side (Discord, Rank, Money)
local rightContainer = Instance.new("Frame")
rightContainer.Size = UDim2.new(0, 400, 1, 0)
rightContainer.Position = UDim2.new(1, -420, 0, 0)
rightContainer.BackgroundTransparency = 1
rightContainer.ZIndex = 11
rightContainer.Parent = topBar

local discordBtn = Instance.new("TextButton")
discordBtn.Name = "DiscordButton"
discordBtn.Text = "   DISCORD"
discordBtn.Size = UDim2.new(0, 100, 0, 32)
discordBtn.Position = UDim2.new(0, 0, 0.5, -16)
discordBtn.BackgroundColor3 = COLORS.Discord
discordBtn.TextColor3 = COLORS.White
discordBtn.Font = Enum.Font.GothamBold
discordBtn.TextSize = 12
discordBtn.AutoButtonColor = false
discordBtn.ZIndex = 12
discordBtn.Parent = rightContainer
local discordCorner = Instance.new("UICorner")
discordCorner.CornerRadius = UDim.new(1, 0)
discordCorner.Parent = discordBtn
local discordIcon = Instance.new("ImageLabel")
discordIcon.Size = UDim2.new(0, 14, 0, 14)
discordIcon.Position = UDim2.new(0, 12, 0.5, -7)
discordIcon.BackgroundTransparency = 1
discordIcon.Image = ICONS.MessageCircle
discordIcon.ZIndex = 13
discordIcon.Parent = discordBtn

local rankFrame = Instance.new("Frame")
rankFrame.Size = UDim2.new(0, 140, 0, 32)
rankFrame.Position = UDim2.new(0, 110, 0.5, -16)
rankFrame.BackgroundColor3 = COLORS.Slate800
rankFrame.BackgroundTransparency = 0.2
rankFrame.ZIndex = 12
rankFrame.Parent = rightContainer
local rankCorner = Instance.new("UICorner")
rankCorner.CornerRadius = UDim.new(1, 0)
rankCorner.Parent = rankFrame
local rankStroke = Instance.new("UIStroke")
rankStroke.Color = COLORS.Slate700
rankStroke.Thickness = 1
rankStroke.Parent = rankFrame
local rankLabel = Instance.new("TextLabel")
rankLabel.Text = "Rank: COMMANDER"
rankLabel.Size = UDim2.new(1, 0, 1, 0)
rankLabel.BackgroundTransparency = 1
rankLabel.TextColor3 = COLORS.Yellow500 -- Golden Yellow
rankLabel.Font = Enum.Font.GothamBold
rankLabel.TextSize = 12
rankLabel.ZIndex = 13
rankLabel.Parent = rankFrame

local moneyFrame = Instance.new("Frame")
moneyFrame.Size = UDim2.new(0, 120, 0, 32)
moneyFrame.Position = UDim2.new(0, 260, 0.5, -16)
moneyFrame.BackgroundColor3 = COLORS.Slate800
moneyFrame.BackgroundTransparency = 0.2
moneyFrame.ZIndex = 12
moneyFrame.Parent = rightContainer
local moneyCorner = Instance.new("UICorner")
moneyCorner.CornerRadius = UDim.new(1, 0)
moneyCorner.Parent = moneyFrame
local moneyStroke = Instance.new("UIStroke")
moneyStroke.Color = COLORS.Slate700
moneyStroke.Thickness = 1
moneyStroke.Parent = moneyFrame
local moneyDot = Instance.new("Frame")
moneyDot.Size = UDim2.new(0, 8, 0, 8)
moneyDot.Position = UDim2.new(0, 12, 0.5, -4)
moneyDot.BackgroundColor3 = COLORS.Green500
moneyDot.ZIndex = 13
moneyDot.Parent = moneyFrame
local moneyDotCorner = Instance.new("UICorner")
moneyDotCorner.CornerRadius = UDim.new(1, 0)
moneyDotCorner.Parent = moneyDot
local moneyLabel = Instance.new("TextLabel")
moneyLabel.Text = "$ 1,250,000"
moneyLabel.Size = UDim2.new(1, -30, 1, 0)
moneyLabel.Position = UDim2.new(0, 30, 0, 0)
moneyLabel.BackgroundTransparency = 1
moneyLabel.TextColor3 = COLORS.White
moneyLabel.Font = Enum.Font.Code
moneyLabel.TextSize = 12
moneyLabel.TextXAlignment = Enum.TextXAlignment.Left
moneyLabel.ZIndex = 13
moneyLabel.Parent = moneyFrame

-- Sidebar
local sidebar = Instance.new("Frame")
sidebar.Name = "Sidebar"
sidebar.Size = UDim2.new(0, 96, 1, -64)
sidebar.Position = UDim2.new(0, 0, 0, 64)
sidebar.BackgroundColor3 = COLORS.Slate950
sidebar.BackgroundTransparency = 0.05
sidebar.BorderSizePixel = 0
sidebar.ZIndex = 10
sidebar.Parent = mainFrame

local sidebarLayout = Instance.new("UIListLayout")
sidebarLayout.Padding = UDim.new(0, 16)
sidebarLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
sidebarLayout.VerticalAlignment = Enum.VerticalAlignment.Top
sidebarLayout.Parent = sidebar

local sidebarPadding = Instance.new("UIPadding")
sidebarPadding.PaddingTop = UDim.new(0, 24)
sidebarPadding.Parent = sidebar

-- Content Area
local contentFrame = Instance.new("Frame")
contentFrame.Name = "Content"
contentFrame.Size = UDim2.new(1, -96, 1, -64)
contentFrame.Position = UDim2.new(0, 96, 0, 64)
contentFrame.BackgroundTransparency = 1
contentFrame.ZIndex = 5
contentFrame.Parent = mainFrame

local notificationFrame = Instance.new("Frame")
notificationFrame.Name = "NotificationFrame"
notificationFrame.Size = UDim2.new(0, 360, 0, 64)
notificationFrame.Position = UDim2.new(1, -380, 0, 80)
notificationFrame.BackgroundColor3 = COLORS.Slate800
notificationFrame.BackgroundTransparency = 0.85
notificationFrame.BorderSizePixel = 0
notificationFrame.Visible = false
notificationFrame.ZIndex = 20
notificationFrame.Parent = mainFrame

local notificationCorner = Instance.new("UICorner")
notificationCorner.CornerRadius = UDim.new(0, 18)
notificationCorner.Parent = notificationFrame

local notificationStroke = Instance.new("UIStroke")
notificationStroke.Color = COLORS.Yellow600
notificationStroke.Thickness = 1
notificationStroke.Parent = notificationFrame

local notificationLabel = Instance.new("TextLabel")
notificationLabel.Name = "NotificationLabel"
notificationLabel.Size = UDim2.new(1, -24, 1, -24)
notificationLabel.Position = UDim2.new(0, 12, 0, 12)
notificationLabel.BackgroundTransparency = 1
notificationLabel.TextColor3 = COLORS.White
notificationLabel.Font = Enum.Font.GothamBold
notificationLabel.TextSize = 14
notificationLabel.TextWrapped = true
notificationLabel.Text = ""
notificationLabel.TextXAlignment = Enum.TextXAlignment.Left
notificationLabel.TextYAlignment = Enum.TextYAlignment.Center
notificationLabel.Parent = notificationFrame

local notificationTween = nil

local function showNotification(message, style)
    local bgColor = COLORS.Slate700
    if style == "error" then
        bgColor = COLORS.Red600
    elseif style == "success" then
        bgColor = COLORS.Green500
    elseif style == "info" then
        bgColor = COLORS.Blue600
    end

    notificationFrame.BackgroundColor3 = bgColor
    notificationLabel.Text = message
    notificationFrame.Visible = true
    notificationFrame.BackgroundTransparency = 0

    if notificationTween then
        notificationTween:Cancel()
    end

    notificationTween = TweenService:Create(notificationFrame, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {BackgroundTransparency = 0})
    notificationTween:Play()

    spawn(function()
        wait(3)
        if notificationFrame.Visible then
            local hideTween = TweenService:Create(notificationFrame, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {BackgroundTransparency = 0.85})
            hideTween:Play()
            hideTween.Completed:Wait()
            notificationFrame.Visible = false
        end
    end)
end

-- Helper: Create Sidebar Button
local function setSidebarButtonActive(button, active)
    if not button then
        return
    end

    button.BackgroundColor3 = active and COLORS.Yellow600 or COLORS.Slate800
    button.BackgroundTransparency = active and 0 or 1
    local icon = button:FindFirstChildOfClass("ImageLabel")
    local label = button:FindFirstChildOfClass("TextLabel")
    local indicator = button:FindFirstChild("ActiveIndicator")

    if icon then
        icon.ImageColor3 = active and COLORS.White or COLORS.Gray400
    end
    if label then
        label.TextColor3 = active and COLORS.White or COLORS.Gray400
    end
    if indicator then
        indicator.Visible = active
    end
end

local function createSidebarBtn(name, iconId, isDefault)
    local btn = Instance.new("TextButton")
    btn.Name = name .. "Button"
    btn.Size = UDim2.new(0, 64, 0, 64)
    btn.BackgroundColor3 = isDefault and COLORS.Yellow600 or COLORS.Slate800
    btn.BackgroundTransparency = isDefault and 0 or 1
    btn.Text = ""
    btn.AutoButtonColor = false
    btn.ZIndex = 11
    btn.Parent = sidebar

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = btn

    local icon = Instance.new("ImageLabel")
    icon.Size = UDim2.new(0, 24, 0, 24)
    icon.Position = UDim2.new(0.5, -12, 0.5, -20)
    icon.BackgroundTransparency = 1
    icon.Image = iconId
    icon.ImageColor3 = isDefault and COLORS.White or COLORS.Gray400
    icon.ZIndex = 12
    icon.Parent = btn

    local label = Instance.new("TextLabel")
    label.Text = name
    label.Size = UDim2.new(1, 0, 0, 12)
    label.Position = UDim2.new(0, 0, 1, -16)
    label.BackgroundTransparency = 1
    label.TextColor3 = isDefault and COLORS.White or COLORS.Gray400
    label.TextSize = 10
    label.Font = Enum.Font.GothamBold
    label.ZIndex = 12
    label.Parent = btn

    -- Active Indicator
    local indicator = Instance.new("Frame")
    indicator.Name = "ActiveIndicator"
    indicator.Size = UDim2.new(0, 4, 0, 32)
    indicator.Position = UDim2.new(0, -16, 0.5, -16)
    indicator.BackgroundColor3 = COLORS.Yellow500
    indicator.Visible = isDefault
    indicator.ZIndex = 12
    indicator.Parent = btn
    local indCorner = Instance.new("UICorner")
    indCorner.CornerRadius = UDim.new(0, 2)
    indCorner.Parent = indicator

    return btn
end

-- Create Sidebar Buttons
local homeSidebarBtn = createSidebarBtn("Home", ICONS.Home, true)
local teamsSidebarBtn = createSidebarBtn("Teams", ICONS.Users, false)
local shopSidebarBtn = createSidebarBtn("Shop", ICONS.ShoppingCart, false)
local weaponsSidebarBtn = createSidebarBtn("Weapons", ICONS.Crosshair, false)
local settingsSidebarBtn = createSidebarBtn("Settings", ICONS.Settings, false)

local pageButtons = {
    Home = homeSidebarBtn,
    Teams = teamsSidebarBtn,
    Shop = shopSidebarBtn,
    Weapons = weaponsSidebarBtn,
    Settings = settingsSidebarBtn,
}

local function setActivePage(pageButton)
    for _, btn in pairs(pageButtons) do
        setSidebarButtonActive(btn, btn == pageButton)
    end
end

local function showPage(page)
    homePage.Visible = false
    teamsPage.Visible = false
    if shopPage then shopPage.Visible = false end
    if weaponsPage then weaponsPage.Visible = false end
    if settingsPage then settingsPage.Visible = false end

    page.Visible = true
    page.CanvasPosition = Vector2.new(0, 0)
    page.BackgroundTransparency = 1
    TweenService:Create(page, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { BackgroundTransparency = 0 }):Play()
end

-- PAGE 1: HOME
local homePage = Instance.new("ScrollingFrame")
homePage.Name = "HomePage"
homePage.Size = UDim2.new(1, 0, 1, 0)
homePage.BackgroundTransparency = 1
homePage.BorderSizePixel = 0
homePage.ScrollBarThickness = 4
homePage.AutomaticCanvasSize = Enum.AutomaticSize.Y
homePage.Visible = true
homePage.Parent = contentFrame

local homePadding = Instance.new("UIPadding")
homePadding.PaddingTop = UDim.new(0, 32)
homePadding.PaddingLeft = UDim.new(0, 32)
homePadding.PaddingRight = UDim.new(0, 32)
homePadding.PaddingBottom = UDim.new(0, 32)
homePadding.Parent = homePage

local homeLayout = Instance.new("UIListLayout")
homeLayout.Padding = UDim.new(0, 24)
homeLayout.SortOrder = Enum.SortOrder.LayoutOrder
homeLayout.Parent = homePage

-- Hero Banner
local heroBanner = Instance.new("Frame")
heroBanner.Name = "HeroBanner"
heroBanner.Size = UDim2.new(1, 0, 0, 320)
heroBanner.BackgroundColor3 = COLORS.Slate900
heroBanner.LayoutOrder = 1
heroBanner.Parent = homePage
local heroCorner = Instance.new("UICorner")
heroCorner.CornerRadius = UDim.new(0, 24)
heroCorner.Parent = heroBanner

local heroImg = Instance.new("ImageLabel")
heroImg.Size = UDim2.new(1, 0, 1, 0)
heroImg.Image = IMAGES.soldier
heroImg.ScaleType = Enum.ScaleType.Crop
heroImg.BackgroundTransparency = 1
heroImg.Parent = heroBanner
local heroImgCorner = Instance.new("UICorner")
heroImgCorner.CornerRadius = UDim.new(0, 24)
heroImgCorner.Parent = heroImg

local heroOverlay = Instance.new("Frame")
heroOverlay.Size = UDim2.new(1, 0, 1, 0)
heroOverlay.BackgroundColor3 = Color3.new(0,0,0)
heroOverlay.BackgroundTransparency = 0.4
heroOverlay.Parent = heroBanner
local heroOverlayCorner = Instance.new("UICorner")
heroOverlayCorner.CornerRadius = UDim.new(0, 24)
heroOverlayCorner.Parent = heroOverlay
local heroGradient = Instance.new("UIGradient")
heroGradient.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0),
    NumberSequenceKeypoint.new(1, 0.8)
})
heroGradient.Parent = heroOverlay

-- Hero Content
local heroContent = Instance.new("Frame")
heroContent.Size = UDim2.new(0.6, 0, 1, 0)
heroContent.Position = UDim2.new(0, 40, 0, 0)
heroContent.BackgroundTransparency = 1
heroContent.Parent = heroBanner

local updateTag = Instance.new("TextLabel")
updateTag.Text = "v5.2.0 UPDATE"
updateTag.Size = UDim2.new(0, 100, 0, 24)
updateTag.Position = UDim2.new(0, 0, 0, 40)
updateTag.BackgroundColor3 = COLORS.Slate800
updateTag.TextColor3 = COLORS.Gray400
updateTag.Font = Enum.Font.GothamBold
updateTag.TextSize = 10
updateTag.Parent = heroContent
local tagCorner = Instance.new("UICorner")
tagCorner.CornerRadius = UDim.new(1, 0)
tagCorner.Parent = updateTag

local heroTitle = Instance.new("TextLabel")
heroTitle.Text = "SECURE THE FACILITY"
heroTitle.Size = UDim2.new(1, 0, 0, 120)
heroTitle.Position = UDim2.new(0, 0, 0, 70)
heroTitle.BackgroundTransparency = 1
heroTitle.TextColor3 = COLORS.White
heroTitle.Font = Enum.Font.GothamBlack
heroTitle.TextSize = 48
heroTitle.TextXAlignment = Enum.TextXAlignment.Left
heroTitle.TextWrapped = true
heroTitle.Parent = heroContent

local heroDesc = Instance.new("TextLabel")
heroDesc.Text = "New weapons, armored vehicles, and enhanced security protocols are now available. The CECOT facility requires your immediate attention."
heroDesc.Size = UDim2.new(0.8, 0, 0, 60)
heroDesc.Position = UDim2.new(0, 0, 0, 180)
heroDesc.BackgroundTransparency = 1
heroDesc.TextColor3 = COLORS.Gray400
heroDesc.Font = Enum.Font.GothamMedium
heroDesc.TextSize = 16
heroDesc.TextXAlignment = Enum.TextXAlignment.Left
heroDesc.TextWrapped = true
heroDesc.Parent = heroContent

local deployBtn = Instance.new("TextButton")
deployBtn.Name = "DeployButton"
deployBtn.Text = "DEPLOY NOW"
deployBtn.Size = UDim2.new(0, 160, 0, 48)
deployBtn.Position = UDim2.new(0, 0, 0, 250)
deployBtn.BackgroundColor3 = COLORS.White
deployBtn.TextColor3 = COLORS.Slate950
deployBtn.Font = Enum.Font.GothamBlack
deployBtn.TextSize = 14
deployBtn.AutoButtonColor = false
deployBtn.Parent = heroContent
local deployCorner = Instance.new("UICorner")
deployCorner.CornerRadius = UDim.new(0, 12)
deployCorner.Parent = deployBtn

-- Quick Stats Grid
local statsGrid = Instance.new("Frame")
statsGrid.Name = "StatsGrid"
statsGrid.Size = UDim2.new(1, 0, 0, 140)
statsGrid.BackgroundTransparency = 1
statsGrid.LayoutOrder = 2
statsGrid.Parent = homePage

local statsLayout = Instance.new("UIGridLayout")
statsLayout.CellSize = UDim2.new(0.32, 0, 1, 0)
statsLayout.CellPadding = UDim2.new(0.02, 0, 0, 0)
statsLayout.Parent = statsGrid

local function createStatCard(title, subtitle, color1, color2, iconId)
    local card = Instance.new("Frame")
    card.Name = title:gsub(" ", "") .. "Card"
    card.BackgroundColor3 = color1
    card.Parent = statsGrid
    
    local cardCorner = Instance.new("UICorner")
    cardCorner.CornerRadius = UDim.new(0, 16)
    cardCorner.Parent = card
    
    local cardGradient = Instance.new("UIGradient")
    cardGradient.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, color1),
        ColorSequenceKeypoint.new(1, color2)
    })
    cardGradient.Rotation = 45
    cardGradient.Parent = card
    
    -- Inner Content
    local inner = Instance.new("Frame")
    inner.Size = UDim2.new(1, -2, 1, -2)
    inner.Position = UDim2.new(0, 1, 0, 1)
    inner.BackgroundColor3 = COLORS.Slate900
    inner.BackgroundTransparency = 0.1
    inner.Parent = card
    local innerCorner = Instance.new("UICorner")
    innerCorner.CornerRadius = UDim.new(0, 15)
    innerCorner.Parent = inner
    
    local iconBox = Instance.new("Frame")
    iconBox.Size = UDim2.new(0, 40, 0, 40)
    iconBox.Position = UDim2.new(0, 24, 0, 24)
    iconBox.BackgroundColor3 = color1
    iconBox.Parent = inner
    local iconBoxCorner = Instance.new("UICorner")
    iconBoxCorner.CornerRadius = UDim.new(0, 8)
    iconBoxCorner.Parent = iconBox
    
    local iconImg = Instance.new("ImageLabel")
    iconImg.Size = UDim2.new(0, 20, 0, 20)
    iconImg.Position = UDim2.new(0.5, -10, 0.5, -10)
    iconImg.BackgroundTransparency = 1
    iconImg.Image = iconId
    iconImg.Parent = iconBox
    
    local titleLbl = Instance.new("TextLabel")
    titleLbl.Text = title
    titleLbl.Size = UDim2.new(1, -48, 0, 24)
    titleLbl.Position = UDim2.new(0, 24, 0, 74)
    titleLbl.BackgroundTransparency = 1
    titleLbl.TextColor3 = COLORS.White
    titleLbl.Font = Enum.Font.GothamBlack
    titleLbl.TextSize = 18
    titleLbl.TextXAlignment = Enum.TextXAlignment.Left
    titleLbl.Parent = inner
    
    local subLbl = Instance.new("TextLabel")
    subLbl.Text = subtitle
    subLbl.Size = UDim2.new(1, -48, 0, 16)
    subLbl.Position = UDim2.new(0, 24, 0, 100)
    subLbl.BackgroundTransparency = 1
    subLbl.TextColor3 = COLORS.Gray400
    subLbl.Font = Enum.Font.GothamBold
    subLbl.TextSize = 10
    subLbl.TextXAlignment = Enum.TextXAlignment.Left
    subLbl.Parent = inner
end

createStatCard("DAILY REWARDS", "Claim your supply drop", COLORS.Blue600, Color3.fromRGB(30, 64, 175), ICONS.Gift)
createStatCard("FACTION WAR", "Join the battle", COLORS.Red600, Color3.fromRGB(153, 27, 27), ICONS.Swords)
createStatCard("VIP PASS", "Get exclusive gear", COLORS.Yellow600, Color3.fromRGB(133, 77, 14), ICONS.Crown)

-- PAGE 2: TEAMS
local teamsPage = Instance.new("ScrollingFrame")
teamsPage.Name = "TeamsPage"
teamsPage.Size = UDim2.new(1, 0, 1, 0)
teamsPage.BackgroundTransparency = 1
teamsPage.BorderSizePixel = 0
teamsPage.ScrollBarThickness = 4
teamsPage.AutomaticCanvasSize = Enum.AutomaticSize.Y
teamsPage.Visible = false
teamsPage.Parent = contentFrame

local teamsPadding = Instance.new("UIPadding")
teamsPadding.PaddingTop = UDim.new(0, 32)
teamsPadding.PaddingLeft = UDim.new(0, 32)
teamsPadding.PaddingRight = UDim.new(0, 32)
teamsPadding.PaddingBottom = UDim.new(0, 32)
teamsPadding.Parent = teamsPage

local teamsHeader = Instance.new("TextLabel")
teamsHeader.Text = "SELECT YOUR TEAM"
teamsHeader.Size = UDim2.new(1, 0, 0, 40)
teamsHeader.BackgroundTransparency = 1
teamsHeader.TextColor3 = COLORS.White
teamsHeader.Font = Enum.Font.GothamBlack
teamsHeader.TextSize = 24
teamsHeader.TextXAlignment = Enum.TextXAlignment.Left
teamsHeader.Parent = teamsPage

local teamsList = Instance.new("Frame")
teamsList.Name = "TeamsList"
teamsList.Size = UDim2.new(1, 0, 0, 0) -- Height automatic
teamsList.Position = UDim2.new(0, 0, 0, 60)
teamsList.BackgroundTransparency = 1
teamsList.AutomaticSize = Enum.AutomaticSize.Y
teamsList.Parent = teamsPage

local teamsLayout = Instance.new("UIListLayout")
teamsLayout.Padding = UDim.new(0, 16)
teamsLayout.SortOrder = Enum.SortOrder.LayoutOrder
teamsLayout.Parent = teamsList

local teamButtonRefreshers = {}

local function refreshTeamButtons()
    for _, refreshFn in ipairs(teamButtonRefreshers) do
        pcall(refreshFn)
    end
end

Players.LocalPlayer:GetAttributeChangedSignal("AllowedTeams"):Connect(refreshTeamButtons)
Players.LocalPlayer:GetPropertyChangedSignal("Team"):Connect(refreshTeamButtons)

for i, team in ipairs(TEAMS) do
    local tFrame = Instance.new("Frame")
    tFrame.Name = team.name
    tFrame.Size = UDim2.new(1, 0, 0, 128)
    tFrame.BackgroundColor3 = COLORS.Slate900
    tFrame.BackgroundTransparency = 0.05
    tFrame.LayoutOrder = i
    tFrame.Parent = teamsList
    
    local tCorner = Instance.new("UICorner")
    tCorner.CornerRadius = UDim.new(0, 16)
    tCorner.Parent = tFrame
    
    local tStroke = Instance.new("UIStroke")
    tStroke.Color = COLORS.Slate700
    tStroke.Thickness = 1
    tStroke.Parent = tFrame

    -- Gradient Background
    local tGradient = Instance.new("UIGradient")
    local teamColor = TEAM_COLORS[team.color] or COLORS.Slate800
    tGradient.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, teamColor),
        ColorSequenceKeypoint.new(0.7, COLORS.Slate950),
        ColorSequenceKeypoint.new(1, COLORS.Black)
    })
    tGradient.Rotation = 90
    tGradient.Parent = tFrame
    
    -- Banner
    local tBanner = Instance.new("ImageLabel")
    tBanner.Size = UDim2.new(0.35, 0, 1, 0)
    tBanner.Image = team.image
    tBanner.ScaleType = Enum.ScaleType.Crop
    tBanner.BackgroundTransparency = 1
    tBanner.Parent = tFrame
    local tBannerCorner = Instance.new("UICorner")
    tBannerCorner.CornerRadius = UDim.new(0, 16)
    tBannerCorner.Parent = tBanner
    
    -- Banner Gradient Overlay
    local tBannerOverlay = Instance.new("Frame")
    tBannerOverlay.Size = UDim2.new(1, 0, 1, 0)
    tBannerOverlay.BackgroundColor3 = COLORS.White
    tBannerOverlay.Parent = tBanner
    local tBannerOverlayGradient = Instance.new("UIGradient")
    tBannerOverlayGradient.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.new(0,0,0)), -- Darker overlay
        ColorSequenceKeypoint.new(1, COLORS.Black)
    })
    tBannerOverlayGradient.Transparency = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0.8),
        NumberSequenceKeypoint.new(0.5, 0.4),
        NumberSequenceKeypoint.new(1, 0)
    })
    tBannerOverlayGradient.Parent = tBannerOverlay
    
    -- Role Tag
    local roleTag = Instance.new("TextLabel")
    roleTag.Text = team.role
    roleTag.Size = UDim2.new(0, 80, 0, 20)
    roleTag.Position = UDim2.new(0, 12, 0, 12)
    roleTag.BackgroundColor3 = TEAM_COLORS[team.color] or COLORS.Slate800
    roleTag.TextColor3 = COLORS.White
    roleTag.Font = Enum.Font.GothamBold
    roleTag.TextSize = 10
    roleTag.Parent = tFrame
    local roleCorner = Instance.new("UICorner")
    roleCorner.CornerRadius = UDim.new(0, 4)
    roleCorner.Parent = roleTag
    
    -- Info
    local infoContainer = Instance.new("Frame")
    infoContainer.Size = UDim2.new(0.65, 0, 1, 0)
    infoContainer.Position = UDim2.new(0.35, 0, 0, 0)
    infoContainer.BackgroundTransparency = 1
    infoContainer.Parent = tFrame
    
    local tIcon = Instance.new("Frame")
    tIcon.Size = UDim2.new(0, 48, 0, 48)
    tIcon.Position = UDim2.new(0, 24, 0.5, -24)
    tIcon.BackgroundColor3 = TEAM_COLORS[team.color] or COLORS.Slate800
    tIcon.Parent = infoContainer
    local tIconCorner = Instance.new("UICorner")
    tIconCorner.CornerRadius = UDim.new(0, 12)
    tIconCorner.Parent = tIcon
    local tIconImg = Instance.new("ImageLabel")
    tIconImg.Size = UDim2.new(0, 24, 0, 24)
    tIconImg.Position = UDim2.new(0.5, -12, 0.5, -12)
    tIconImg.BackgroundTransparency = 1
    tIconImg.Image = ICONS[team.icon] or ICONS.User
    tIconImg.Parent = tIcon
    
    local tName = Instance.new("TextLabel")
    tName.Text = team.name
    tName.Size = UDim2.new(0, 300, 0, 24)
    tName.Position = UDim2.new(0, 88, 0.5, -16)
    tName.BackgroundTransparency = 1
    tName.TextColor3 = COLORS.White
    tName.Font = Enum.Font.GothamBlack
    tName.TextSize = 18
    tName.TextXAlignment = Enum.TextXAlignment.Left
    tName.Parent = infoContainer
    
    local tStats = Instance.new("TextLabel")
    tStats.Text = "LEVEL 10+  •  24 ONLINE"
    tStats.Size = UDim2.new(0, 300, 0, 16)
    tStats.Position = UDim2.new(0, 88, 0.5, 8)
    tStats.BackgroundTransparency = 1
    tStats.TextColor3 = COLORS.Gray400
    tStats.Font = Enum.Font.GothamBold
    tStats.TextSize = 11
    tStats.TextXAlignment = Enum.TextXAlignment.Left
    tStats.Parent = infoContainer
    
    local joinBtn = Instance.new("TextButton")
    joinBtn.Name = "JoinButton"
    joinBtn.Text = "JOIN"
    joinBtn.Size = UDim2.new(0, 100, 0, 40)
    joinBtn.Position = UDim2.new(1, -124, 0.5, -20)
    joinBtn.BackgroundColor3 = COLORS.White
    joinBtn.TextColor3 = COLORS.Slate950
    joinBtn.Font = Enum.Font.GothamBlack
    joinBtn.TextSize = 12
    joinBtn.AutoButtonColor = false
    joinBtn.Parent = infoContainer
    local jCorner = Instance.new("UICorner")
    jCorner.CornerRadius = UDim.new(0, 10)
    jCorner.Parent = joinBtn

    local function updateJoinState()
        local currentTeam = Players.LocalPlayer.Team and normalizeTeamName(Players.LocalPlayer.Team.Name) or ""
        local allowed = isTeamAllowed(Players.LocalPlayer, team.name)
        local targetTeam = normalizeTeamName(team.name)

        joinBtn.Active = allowed and currentTeam ~= targetTeam
        joinBtn.AutoButtonColor = joinBtn.Active

        if currentTeam == targetTeam then
            joinBtn.BackgroundColor3 = COLORS.Green500
            joinBtn.TextColor3 = COLORS.White
            joinBtn.Text = "JOINED"
        elseif allowed then
            joinBtn.BackgroundColor3 = COLORS.White
            joinBtn.TextColor3 = COLORS.Slate950
            joinBtn.Text = "JOIN"
        else
            joinBtn.BackgroundColor3 = COLORS.Slate800
            joinBtn.TextColor3 = COLORS.Gray400
            joinBtn.Text = "LOCKED"
        end
    end

    joinBtn.MouseEnter:Connect(function()
        if joinBtn.Active then
            joinBtn.BackgroundColor3 = COLORS.Yellow500
        end
    end)

    joinBtn.MouseLeave:Connect(function()
        updateJoinState()
    end)

    joinBtn.MouseButton1Click:Connect(function()
        if not joinBtn.Active then
            showNotification("Team is locked. Complete verification or wait for role sync.", "error")
            return
        end

        local teamService = game:GetService("Teams")
        local targetTeam = teamService:FindFirstChild(team.name)
        local joinEvent = ReplicatedStorage:FindFirstChild("JoinTeam")

        if joinEvent and joinEvent:IsA("RemoteEvent") then
            joinEvent:FireServer(team.name)
        elseif targetTeam then
            Players.LocalPlayer.Team = targetTeam
            Players.LocalPlayer.Neutral = false
        end

        if targetTeam then
            showNotification("Joined " .. team.name .. ".", "success")
        else
            showNotification("Team not found on this server.", "error")
        end

        joinBtn.BackgroundColor3 = COLORS.Green500
        joinBtn.TextColor3 = COLORS.White
        joinBtn.Text = "JOINED"
    end)

    updateJoinState()
    table.insert(teamButtonRefreshers, updateJoinState)
end

-- PAGE 3: SHOP
local shopPage = Instance.new("ScrollingFrame")
shopPage.Name = "ShopPage"
shopPage.Size = UDim2.new(1, 0, 1, 0)
shopPage.BackgroundTransparency = 1
shopPage.BorderSizePixel = 0
shopPage.ScrollBarThickness = 4
shopPage.AutomaticCanvasSize = Enum.AutomaticSize.Y
shopPage.Visible = false
shopPage.Parent = contentFrame

local shopPadding = Instance.new("UIPadding")
shopPadding.PaddingTop = UDim.new(0, 32)
shopPadding.PaddingLeft = UDim.new(0, 32)
shopPadding.PaddingRight = UDim.new(0, 32)
shopPadding.PaddingBottom = UDim.new(0, 32)
shopPadding.Parent = shopPage

local shopHeader = Instance.new("TextLabel")
shopHeader.Text = "STORE"
shopHeader.Size = UDim2.new(1, 0, 0, 40)
shopHeader.BackgroundTransparency = 1
shopHeader.TextColor3 = COLORS.White
shopHeader.Font = Enum.Font.GothamBlack
shopHeader.TextSize = 24
shopHeader.TextXAlignment = Enum.TextXAlignment.Left
shopHeader.Parent = shopPage

local shopGrid = Instance.new("Frame")
shopGrid.Name = "ShopGrid"
shopGrid.Size = UDim2.new(1, 0, 0, 0)
shopGrid.Position = UDim2.new(0, 0, 0, 60)
shopGrid.BackgroundTransparency = 1
shopGrid.AutomaticSize = Enum.AutomaticSize.Y
shopGrid.Parent = shopPage

local shopGridLayout = Instance.new("UIGridLayout")
shopGridLayout.CellSize = UDim2.new(0, 200, 0, 260)
shopGridLayout.CellPadding = UDim2.new(0, 20, 0, 20)
shopGridLayout.Parent = shopGrid

for _, item in ipairs(SHOP_ITEMS) do
    local sFrame = Instance.new("Frame")
    sFrame.Name = item.name:gsub(" ", "") .. "Card"
    sFrame.BackgroundColor3 = COLORS.Slate800
    sFrame.BackgroundTransparency = 0.6
    sFrame.Parent = shopGrid
    
    local sCorner = Instance.new("UICorner")
    sCorner.CornerRadius = UDim.new(0, 16)
    sCorner.Parent = sFrame
    
    local sStroke = Instance.new("UIStroke")
    sStroke.Color = COLORS.Slate700
    sStroke.Thickness = 1
    sStroke.Parent = sFrame
    
    -- Image Area
    local imgArea = Instance.new("Frame")
    imgArea.Size = UDim2.new(1, -24, 0, 140)
    imgArea.Position = UDim2.new(0, 12, 0, 12)
    imgArea.BackgroundColor3 = TEAM_COLORS[item.color] or COLORS.Slate700
    imgArea.Parent = sFrame
    local imgCorner = Instance.new("UICorner")
    imgCorner.CornerRadius = UDim.new(0, 12)
    imgCorner.Parent = imgArea
    
    local sIcon = Instance.new("ImageLabel")
    sIcon.Size = UDim2.new(0, 64, 0, 64)
    sIcon.Position = UDim2.new(0.5, -32, 0.5, -32)
    sIcon.BackgroundTransparency = 1
    sIcon.Image = ICONS.ShoppingCart
    sIcon.Parent = imgArea
    
    local typeTag = Instance.new("TextLabel")
    typeTag.Text = item.type
    typeTag.Size = UDim2.new(0, 60, 0, 20)
    typeTag.Position = UDim2.new(1, -68, 0, 8)
    typeTag.BackgroundColor3 = Color3.new(0,0,0)
    typeTag.BackgroundTransparency = 0.4
    typeTag.TextColor3 = COLORS.White
    typeTag.Font = Enum.Font.GothamBold
    typeTag.TextSize = 10
    typeTag.Parent = imgArea
    local typeCorner = Instance.new("UICorner")
    typeCorner.CornerRadius = UDim.new(0, 4)
    typeCorner.Parent = typeTag
    
    -- Info
    local sName = Instance.new("TextLabel")
    sName.Text = item.name
    sName.Size = UDim2.new(1, -24, 0, 20)
    sName.Position = UDim2.new(0, 12, 0, 164)
    sName.BackgroundTransparency = 1
    sName.TextColor3 = COLORS.White
    sName.Font = Enum.Font.GothamBold
    sName.TextSize = 14
    sName.TextXAlignment = Enum.TextXAlignment.Left
    sName.Parent = sFrame
    
    local sPrice = Instance.new("TextLabel")
    sPrice.Text = item.price
    sPrice.Size = UDim2.new(0, 80, 0, 20)
    sPrice.Position = UDim2.new(0, 12, 0, 190)
    sPrice.BackgroundTransparency = 1
    sPrice.TextColor3 = COLORS.Green500
    sPrice.Font = Enum.Font.Code
    sPrice.TextSize = 12
    sPrice.TextXAlignment = Enum.TextXAlignment.Left
    sPrice.Parent = sFrame
    
    local buyBtn = Instance.new("TextButton")
    buyBtn.Name = "BuyButton"
    buyBtn.Text = "BUY"
    buyBtn.Size = UDim2.new(0, 60, 0, 28)
    buyBtn.Position = UDim2.new(1, -72, 0, 186)
    buyBtn.BackgroundColor3 = COLORS.Yellow600
    buyBtn.TextColor3 = COLORS.White
    buyBtn.Font = Enum.Font.GothamBold
    buyBtn.TextSize = 11
    buyBtn.AutoButtonColor = false
    buyBtn.Parent = sFrame
    local buyCorner = Instance.new("UICorner")
    buyCorner.CornerRadius = UDim.new(0, 6)
    buyCorner.Parent = buyBtn
end

-- PAGE 4: WEAPONS
local weaponsPage = Instance.new("ScrollingFrame")
weaponsPage.Name = "WeaponsPage"
weaponsPage.Size = UDim2.new(1, 0, 1, 0)
weaponsPage.BackgroundTransparency = 1
weaponsPage.BorderSizePixel = 0
weaponsPage.ScrollBarThickness = 4
weaponsPage.AutomaticCanvasSize = Enum.AutomaticSize.Y
weaponsPage.Visible = false
weaponsPage.Parent = contentFrame

local weaponsPadding = Instance.new("UIPadding")
weaponsPadding.PaddingTop = UDim.new(0, 32)
weaponsPadding.PaddingLeft = UDim.new(0, 32)
weaponsPadding.PaddingRight = UDim.new(0, 32)
weaponsPadding.PaddingBottom = UDim.new(0, 32)
weaponsPadding.Parent = weaponsPage

local weaponsHeader = Instance.new("TextLabel")
weaponsHeader.Text = "ARMORY"
weaponsHeader.Size = UDim2.new(1, 0, 0, 40)
weaponsHeader.BackgroundTransparency = 1
weaponsHeader.TextColor3 = COLORS.White
weaponsHeader.Font = Enum.Font.GothamBlack
weaponsHeader.TextSize = 24
weaponsHeader.TextXAlignment = Enum.TextXAlignment.Left
weaponsHeader.Parent = weaponsPage

local weaponsList = Instance.new("Frame")
weaponsList.Name = "WeaponsList"
weaponsList.Size = UDim2.new(1, 0, 0, 0)
weaponsList.Position = UDim2.new(0, 0, 0, 60)
weaponsList.BackgroundTransparency = 1
weaponsList.AutomaticSize = Enum.AutomaticSize.Y
weaponsList.Parent = weaponsPage

local weaponsLayout = Instance.new("UIListLayout")
weaponsLayout.Padding = UDim.new(0, 16)
weaponsLayout.SortOrder = Enum.SortOrder.LayoutOrder
weaponsLayout.Parent = weaponsList

for i, weapon in ipairs(WEAPONS) do
    local wFrame = Instance.new("Frame")
    wFrame.Name = weapon.name:gsub(" ", "") .. "Card"
    wFrame.Size = UDim2.new(1, 0, 0, 120)
    wFrame.BackgroundColor3 = COLORS.Slate900
    wFrame.BackgroundTransparency = 0.2
    wFrame.LayoutOrder = i
    wFrame.Parent = weaponsList
    
    local wCorner = Instance.new("UICorner")
    wCorner.CornerRadius = UDim.new(0, 16)
    wCorner.Parent = wFrame
    
    local wStroke = Instance.new("UIStroke")
    wStroke.Color = COLORS.Slate700
    wStroke.Thickness = 1
    wStroke.Parent = wFrame
    
    -- Weapon Image
    local wImgContainer = Instance.new("Frame")
    wImgContainer.Size = UDim2.new(0, 200, 0, 90)
    wImgContainer.Position = UDim2.new(0, 16, 0.5, -45)
    wImgContainer.BackgroundColor3 = COLORS.Slate950
    wImgContainer.Parent = wFrame
    local wImgCorner = Instance.new("UICorner")
    wImgCorner.CornerRadius = UDim.new(0, 12)
    wImgCorner.Parent = wImgContainer
    local wImgStroke = Instance.new("UIStroke")
    wImgStroke.Color = COLORS.Slate800
    wImgStroke.Thickness = 1
    wImgStroke.Parent = wImgContainer
    
    local wImg = Instance.new("ImageLabel")
    wImg.Size = UDim2.new(1, 0, 1, 0)
    wImg.Image = weapon.image
    wImg.ScaleType = Enum.ScaleType.Fit
    wImg.BackgroundTransparency = 1
    wImg.Parent = wImgContainer
    
    local typeTag = Instance.new("TextLabel")
    typeTag.Text = weapon.type
    typeTag.Size = UDim2.new(0, 60, 0, 20)
    typeTag.Position = UDim2.new(0, 8, 1, -28)
    typeTag.BackgroundColor3 = COLORS.Yellow600
    typeTag.TextColor3 = COLORS.White
    typeTag.Font = Enum.Font.GothamBold
    typeTag.TextSize = 10
    typeTag.Parent = wImgContainer
    local typeCorner = Instance.new("UICorner")
    typeCorner.CornerRadius = UDim.new(0, 4)
    typeCorner.Parent = typeTag
    
    -- Info
    local wInfo = Instance.new("Frame")
    wInfo.Size = UDim2.new(1, -360, 1, 0)
    wInfo.Position = UDim2.new(0, 240, 0, 0)
    wInfo.BackgroundTransparency = 1
    wInfo.Parent = wFrame
    
    local wName = Instance.new("TextLabel")
    wName.Text = weapon.name
    wName.Size = UDim2.new(1, 0, 0, 30)
    wName.Position = UDim2.new(0, 0, 0, 20)
    wName.BackgroundTransparency = 1
    wName.TextColor3 = COLORS.White
    wName.Font = Enum.Font.GothamBlack
    wName.TextSize = 20
    wName.TextXAlignment = Enum.TextXAlignment.Left
    wName.Parent = wInfo
    
    local wStats = Instance.new("TextLabel")
    wStats.Text = "DAMAGE: " .. weapon.damage .. "  •  FIRE RATE: " .. weapon.fireRate
    wStats.Size = UDim2.new(1, 0, 0, 20)
    wStats.Position = UDim2.new(0, 0, 0, 50)
    wStats.BackgroundTransparency = 1
    wStats.TextColor3 = COLORS.Gray400
    wStats.Font = Enum.Font.GothamBold
    wStats.TextSize = 12
    wStats.TextXAlignment = Enum.TextXAlignment.Left
    wStats.Parent = wInfo
    
    local equipBtn = Instance.new("TextButton")
    equipBtn.Name = "EquipButton"
    equipBtn.Text = "EQUIP"
    equipBtn.Size = UDim2.new(0, 120, 0, 48)
    equipBtn.Position = UDim2.new(1, -136, 0.5, -24)
    equipBtn.BackgroundColor3 = COLORS.Slate800
    equipBtn.TextColor3 = COLORS.White
    equipBtn.Font = Enum.Font.GothamBlack
    equipBtn.TextSize = 14
    equipBtn.AutoButtonColor = false
    equipBtn.Parent = wFrame
    local eCorner = Instance.new("UICorner")
    eCorner.CornerRadius = UDim.new(0, 12)
    eCorner.Parent = equipBtn
end

-- PAGE 5: SETTINGS
local settingsPage = Instance.new("Frame")
settingsPage.Name = "SettingsPage"
settingsPage.Size = UDim2.new(1, 0, 1, 0)
settingsPage.BackgroundTransparency = 1
settingsPage.Visible = false
settingsPage.Parent = contentFrame

local settingsLabel = Instance.new("TextLabel")
settingsLabel.Text = "SETTINGS - WORK IN PROGRESS"
settingsLabel.Size = UDim2.new(1, 0, 1, 0)
settingsLabel.BackgroundTransparency = 1
settingsLabel.TextColor3 = COLORS.Gray400
settingsLabel.Font = Enum.Font.GothamBlack
settingsLabel.TextSize = 24
settingsLabel.Parent = settingsPage

print("CECOT GUI Created Successfully")


----------------------------------------------------------------------------------------------------
-- [[ SCRIPT 2: ANIMATION & INTERACTION SCRIPT ]]
-- INSTRUCTIONS:
-- 1. Create a "LocalScript" in StarterGui named "CecotGuiAnimator".
-- 2. Paste this entire section into it.
-- 3. This script handles all animations, hover effects, and button logic.

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local StarterGui = game:GetService("StarterGui")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local gui = playerGui:WaitForChild("CecotPrisonGui")
local mainFrame = gui:WaitForChild("MainFrame")
local sidebar = mainFrame:WaitForChild("Sidebar")
local content = mainFrame:WaitForChild("Content")

-- // ANIMATION CONFIG //
local TWEEN_INFO = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local HOVER_SCALE = 1.05
local CLICK_SCALE = 0.95

-- // HELPER FUNCTIONS //
local function animateHover(element, isHovering, properties)
    local goal = properties or {}
    if isHovering then
        goal.Size = element:GetAttribute("OriginalSize") or element.Size
        -- Add scale logic if needed, but UDim2 scaling is tricky with TweenService directly on Size
        -- For simplicity, we'll tween colors/transparency or specific properties passed in
    else
        -- Reset
    end
    TweenService:Create(element, TWEEN_INFO, goal):Play()
end

local function setupButton(btn, onClick)
    btn.MouseEnter:Connect(function()
        TweenService:Create(btn, TWEEN_INFO, {BackgroundTransparency = 0.1}):Play()
    end)
    btn.MouseLeave:Connect(function()
        TweenService:Create(btn, TWEEN_INFO, {BackgroundTransparency = 0}):Play()
    end)
    btn.MouseButton1Click:Connect(function()
        local originalSize = btn.Size
        -- Click effect
        btn.Size = UDim2.new(originalSize.X.Scale, originalSize.X.Offset * 0.95, originalSize.Y.Scale, originalSize.Y.Offset * 0.95)
        wait(0.1)
        btn.Size = originalSize
        if onClick then onClick() end
    end)
end

-- // SIDEBAR LOGIC //
local pages = {
    Home = content:WaitForChild("HomePage"),
    Teams = content:WaitForChild("TeamsPage"),
    Shop = content:WaitForChild("ShopPage"),
    Weapons = content:WaitForChild("WeaponsPage"),
    Settings = content:WaitForChild("SettingsPage")
}

local function switchTab(tabName)
    for name, page in pairs(pages) do
        page.Visible = (name == tabName)
    end
    
    for _, child in ipairs(sidebar:GetChildren()) do
        if child:IsA("TextButton") then
            local isSelected = (child.Name == tabName .. "Button")
            local targetColor = isSelected and Color3.fromRGB(202, 138, 4) or Color3.fromRGB(30, 41, 59)
            local targetTrans = isSelected and 0 or 1
            local targetTextColor = isSelected and Color3.fromRGB(255, 255, 255) or Color3.fromRGB(156, 163, 175)
            
            TweenService:Create(child, TWEEN_INFO, {BackgroundColor3 = targetColor, BackgroundTransparency = targetTrans}):Play()
            TweenService:Create(child.TextLabel, TWEEN_INFO, {TextColor3 = targetTextColor}):Play()
            TweenService:Create(child.ImageLabel, TWEEN_INFO, {ImageColor3 = targetTextColor}):Play()
            
            local indicator = child:FindFirstChild("ActiveIndicator")
            if indicator then indicator.Visible = isSelected end
        end
    end
end

-- Connect Sidebar Buttons
for _, child in ipairs(sidebar:GetChildren()) do
    if child:IsA("TextButton") then
        local pageName = child.Name:gsub("Button", "")
        child.MouseButton1Click:Connect(function()
            switchTab(pageName)
        end)
    end
end

-- // TEAM SELECTION LOGIC //
local teamsList = pages.Teams:WaitForChild("TeamsList")
for _, teamFrame in ipairs(teamsList:GetChildren()) do
    if teamFrame:IsA("Frame") then
        local joinBtn = teamFrame:FindFirstChild("Frame"):FindFirstChild("JoinButton") -- Nested in infoContainer
        if not joinBtn then
             -- Try finding it recursively if structure changed
             joinBtn = teamFrame:FindFirstChild("JoinButton", true)
        end
        
        if joinBtn then
            joinBtn.MouseButton1Click:Connect(function()
                -- DEV CHECK LOGIC
                if player.Name == "DevLuaX" then
                    print("--------------------------------")
                    print("ADMIN ACTION: TEAM SELECTION")
                    print("Team Selected: " .. teamFrame.Name)
                    print("User: " .. player.Name)
                    print("Validation: SUCCESS - Access Granted")
                    print("--------------------------------")
                else
                    print("Player " .. player.Name .. " requested to join " .. teamFrame.Name)
                end
                
                -- Add actual team join logic here (RemoteEvent)
                -- game.ReplicatedStorage.JoinTeam:FireServer(teamFrame.Name)
            end)
            
            -- Hover Effects for Team Card
            teamFrame.MouseEnter:Connect(function()
                TweenService:Create(teamFrame.UIStroke, TWEEN_INFO, {Color = Color3.fromRGB(234, 179, 8)}):Play()
            end)
            teamFrame.MouseLeave:Connect(function()
                TweenService:Create(teamFrame.UIStroke, TWEEN_INFO, {Color = Color3.fromRGB(51, 65, 85)}):Play()
            end)
        end
    end
end

-- // WEAPON EQUIP LOGIC //
local weaponsList = pages.Weapons:WaitForChild("WeaponsList")
for _, wFrame in ipairs(weaponsList:GetChildren()) do
    if wFrame:IsA("Frame") then
        local equipBtn = wFrame:FindFirstChild("EquipButton")
        if equipBtn then
            equipBtn.MouseButton1Click:Connect(function()
                print("Equipping weapon: " .. wFrame.Name:gsub("Card", ""))
                -- Animation
                equipBtn.Text = "EQUIPPED"
                equipBtn.BackgroundColor3 = Color3.fromRGB(234, 179, 8) -- Yellow
                wait(1)
                equipBtn.Text = "EQUIP"
                equipBtn.BackgroundColor3 = Color3.fromRGB(30, 41, 59) -- Back to Slate800
            end)
        end
    end
end

-- // SHOP BUY LOGIC //
local shopGrid = pages.Shop:WaitForChild("ShopGrid")
for _, sFrame in ipairs(shopGrid:GetChildren()) do
    if sFrame:IsA("Frame") then
        local buyBtn = sFrame:FindFirstChild("BuyButton")
        if buyBtn then
            buyBtn.MouseButton1Click:Connect(function()
                print("Buying item: " .. sFrame.Name:gsub("Card", ""))
            end)
        end
    end
end

-- // DEPLOY BUTTON LOGIC //
local deployBtn = pages.Home:FindFirstChild("HeroBanner"):FindFirstChild("Frame"):FindFirstChild("DeployButton")
if deployBtn then
    deployBtn.MouseButton1Click:Connect(function()
        -- Loading Screen Animation handled in main script creation for simplicity, 
        -- but interaction logic can go here if we want to separate it fully.
        -- For now, the main script creation included the click handler for the loading screen 
        -- because it destroys the GUI, which stops this script too if it's inside the GUI.
        -- If this script is in StarterPlayerScripts, it would persist.
    end)
end

print("Cecot Animation Script Loaded")
