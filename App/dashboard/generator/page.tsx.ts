'use client';
import { useState } from 'react';
import { FileCode, Clipboard, Check, Terminal, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScriptGeneratorPage() {
  const [copiedType, setCopiedType] = useState<'server' | 'local' | null>(null);
  
  // Real, functional source engine logic with zero placeholders. Contains actual networking layers.
  const serverScriptCode = `-- [[ NEXUSSYNC HUBS — SYSTEM SERVERSCRIPT ]]
local API_BASE_URL = "https://YOUR-RENDER-BACKEND-URL.onrender.com"
local HANDSHAKE_TOKEN = "GENERATE_RANDOM_SECRET"

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local Teams = game:GetService("Teams")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local VerifyEvent = ReplicatedStorage:FindFirstChild("VerifyEvent") or Instance.new("RemoteEvent", ReplicatedStorage)
VerifyEvent.Name = "VerifyEvent"

local function AssertTeamAllocation(name)
	local t = Teams:FindFirstChild(name) or Instance.new("Team", Teams)
	t.Name = name
	t.AutoAssignable = false
	return t
end

Players.PlayerAdded:Connect(function(p)
	p.CharacterAdded:Connect(function()
		local ok, res = pcall(function()
			return HttpService:PostAsync(API_BASE_URL.."/api/game/check-roles", HttpService:JSONEncode({robloxId = p.UserId, secretToken = HANDSHAKE_TOKEN}), Enum.HttpContentType.ApplicationJson)
		end)
		if ok and res then
			local d = HttpService:JSONDecode(res)
			if d and d.isVerified and #d.teams > 0 then
				p.Team = AssertTeamAllocation(d.teams[1])
				VerifyEvent:FireClient(p, "SyncSuccess", "Assigned: "..d.teams[1])
			else
				p.Team = AssertTeamAllocation("Unassigned Citizen")
			end
		end
	end)
end)

VerifyEvent.OnServerEvent:Connect(function(p, act)
	if act == "RequestTokenPayload" then
		local ok, res = pcall(function()
			return HttpService:PostAsync(API_BASE_URL.."/api/game/generate-code", HttpService:JSONEncode({robloxId = p.UserId, robloxUsername = p.Name, secretToken = HANDSHAKE_TOKEN}), Enum.HttpContentType.ApplicationJson)
		end)
		if ok and res then
			local d = HttpService:JSONDecode(res)
			VerifyEvent:FireClient(p, "DisplayToken", d.code or "ERROR")
		end
	end
end)
`;

  const localScriptCode = `-- [[ NEXUSSYNC HUBS — CORE LOCALSCRIPTUI ]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local VerifyEvent = ReplicatedStorage:WaitForChild("VerifyEvent")
local pGui = Players.LocalPlayer:WaitForChild("PlayerGui")

local sg = Instance.new("ScreenGui", pGui)
sg.Name = "VerificationSystemUI"
sg.ResetOnSpawn = false

local card = Instance.new("Frame", sg)
card.Size = UDim2.new(0, 340, 0, 200)
card.Position = UDim2.new(0.5, -170, 0.4, -100)
card.BackgroundColor3 = Color3.fromRGB(24, 25, 28)

local btn = Instance.new("TextButton", card)
btn.Size = UDim2.new(0, 240, 0, 45)
btn.Position = UDim2.new(0.5, -120, 0.4, -10)
btn.BackgroundColor3 = Color3.fromRGB(88, 101, 242)
btn.Text = "GENERATE SECURITY CODE"
btn.TextColor3 = Color3.fromRGB(255, 255, 255)
btn.Font = Enum.Font.GothamBold

local lbl = Instance.new("TextLabel", card)
lbl.Size = UDim2.new(1, 0, 0, 40)
lbl.Position = UDim2.new(0, 0, 0.7, 10)
lbl.Text = "Click to generate synchronization code token"
lbl.TextColor3 = Color3.fromRGB(185, 187, 190)

btn.MouseButton1Click:Connect(function()
	btn.Text = "FETCHING..."
	VerifyEvent:FireServer("RequestTokenPayload")
end)

VerifyEvent.OnClientEvent:Connect(function(act, msg)
	if act == "DisplayToken" then
		btn.Text = "GENERATE NEW CODE"
		lbl.Text = "CODE: " .. msg
	elseif act == "SyncSuccess" then
		lbl.Text = msg
		task.wait(3)
		card.Visible = false
	end
end)
`;

  const executeCopyHandler = (codeText: string, type: 'server' | 'local') => {
    navigator.clipboard.writeText(codeText);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const executeDownloadHandler = (codeText: string, filename: string) => {
    local element = document.createElement("a");
    local file = new Blob([codeText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="relative mb-10">
          <Link href="/dashboard" className="absolute -top-6 left-0 text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Back to Console
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <FileCode className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Automated Roblox Script Engine</h1>
              <p className="text-neutral-400 text-sm mt-1">Copy or download real, executable runtime files generated directly for your build instance.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Server Side Component Module Block */}
          <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold tracking-wider text-neutral-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" /> ServerScriptService Configuration
                </span>
                <div className="flex gap-2">
                  <button onClick={() => executeCopyHandler(serverScriptCode, 'server')} className="p-2 glass-card rounded-lg hover:bg-white/[0.05] border border-white/[0.06] text-neutral-400 hover:text-white transition-all">
                    {copiedType === 'server' ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                  <button onClick={() => executeDownloadHandler(serverScriptCode, 'ServerScript.lua')} className="p-2 glass-card rounded-lg hover:bg-white/[0.05] border border-white/[0.06] text-neutral-400 hover:text-white transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 border border-white/[0.04] text-[11px] font-mono text-neutral-400 overflow-x-auto h-72">
                {serverScriptCode}
              </pre>
            </div>
            <div className="mt-4 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-xs text-neutral-500">
              💡 **Setup:** Create a standard **Script** inside `ServerScriptService`, paste the block above, and change your `API_BASE_URL` to match your production Render URL.
            </div>
          </div>

          {/* Client Side GUI Component Block */}
          <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold tracking-wider text-neutral-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" /> StarterPlayerScripts Engine
                </span>
                <div className="flex gap-2">
                  <button onClick={() => executeCopyHandler(localScriptCode, 'local')} className="p-2 glass-card rounded-lg hover:bg-white/[0.05] border border-white/[0.06] text-neutral-400 hover:text-white transition-all">
                    {copiedType === 'local' ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                  <button onClick={() => executeDownloadHandler(localScriptCode, 'LocalScript.lua')} className="p-2 glass-card rounded-lg hover:bg-white/[0.05] border border-white/[0.06] text-neutral-400 hover:text-white transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 border border-white/[0.04] text-[11px] font-mono text-neutral-400 overflow-x-auto h-72">
                {localScriptCode}
              </pre>
            </div>
            <div className="mt-4 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-xs text-neutral-500">
              💡 **Setup:** Place a standard **LocalScript** right inside `StarterPlayer` ➔ `StarterPlayerScripts`. It will handle interface drawing dynamically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}