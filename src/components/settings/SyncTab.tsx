"use client";

import type { Conflict } from "@gamerdexapp/gamerdex-sync";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { AppData } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { type SyncErrorKind, useSync } from "@/lib/contexts/SyncContext";
import { formatDateTime, formatNumber } from "@/lib/format";
import {
	CREATE_REPOSITORY_URL,
	DATA_REPOSITORY_NAME,
	type DataRepository,
	findDataRepository,
} from "@/lib/sync/repository";
import { Badge } from "@/comps/ui/Badge";
import { Button, buttonClasses } from "@/comps/ui/Button";
import { Note } from "@/comps/ui/Note";
import { SettingsCard } from "./SettingsCard";

const valueText = (value: unknown) =>
	value === undefined ? null : typeof value === "string" ? value : JSON.stringify(value);

type Lookup =
	| { state: "loading" }
	| { state: "failed" }
	| { state: "done"; repository: Exclude<DataRepository, { kind: "ready" }> };

function RepositoryPicker() {
	const t = useTranslations("sync.repository");
	const { listRepositories, chooseRepository, installApp } = useSync();
	const [lookup, setLookup] = useState<Lookup>({ state: "loading" });
	const name = DATA_REPOSITORY_NAME;

	const look = () =>
		listRepositories().then(
			(repositories) => {
				const repository = findDataRepository(repositories);
				if (repository.kind === "ready") chooseRepository(repository.fullName);
				else setLookup({ state: "done", repository });
			},
			() => setLookup({ state: "failed" })
		);

	const checkAgain = () => {
		setLookup({ state: "loading" });
		void look();
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => void look(), []);

	const checkAgainButton = (
		<Button variant="secondary" onClick={checkAgain}>
			{t("recheckButton")}
		</Button>
	);

	return (
		<SettingsCard title={t("title")} description={t("body", { name })}>
			{lookup.state === "loading" && <p className="text-muted">{t("checking", { name })}</p>}
			{lookup.state === "failed" && (
				<>
					<Note tone="warning">{t("checkFailed")}</Note>
					<div>{checkAgainButton}</div>
				</>
			)}
			{lookup.state === "done" && lookup.repository.kind === "public" && (
				<>
					<Note tone="warning">
						{t("public", { fullName: lookup.repository.fullName })}
					</Note>
					<div>{checkAgainButton}</div>
				</>
			)}
			{lookup.state === "done" && lookup.repository.kind === "missing" && (
				<>
					<p className="font-semibold">{t("missing", { name })}</p>
					<ol className="list-decimal space-y-4 ps-5 marker:font-semibold">
						<li className="list-item">
							<span className="block">{t("steps.create", { name })}</span>
							<span className="mt-2 block">
								<a
									className={buttonClasses("secondary")}
									href={CREATE_REPOSITORY_URL}
									target="_blank"
									rel="noreferrer"
								>
									{t("createButton")}
								</a>
							</span>
						</li>
						<li className="list-item">
							<span className="block">{t("steps.install", { name })}</span>
							<span className="mt-2 block">
								<Button onClick={installApp}>{t("installButton")}</Button>
							</span>
						</li>
						<li className="list-item">
							<span className="block">{t("steps.recheck")}</span>
							<span className="mt-2 block">{checkAgainButton}</span>
						</li>
					</ol>
				</>
			)}
		</SettingsCard>
	);
}

function ChoiceCard({ local, remote }: { local: AppData; remote: AppData }) {
	const t = useTranslations("sync");
	const { syncNow } = useSync();
	const count = (data: AppData) =>
		t("chiefCount", {
			count: data.playthroughs.length,
			amount: formatNumber(data.playthroughs.length),
		});

	return (
		<SettingsCard title={t("choice.title")} description={t("choice.body")}>
			<p>{t("choice.counts", { local: count(local), cloud: count(remote) })}</p>
			<div className="flex flex-col gap-3 sm:flex-row">
				<div className="flex flex-1 flex-col gap-1">
					<Button variant="primary" onClick={() => void syncNow("merge")}>
						{t("choice.merge")}
					</Button>
					<p className="text-muted">{t("choice.mergeHint")}</p>
				</div>
				<div className="flex flex-1 flex-col gap-1">
					<Button onClick={() => void syncNow("keep-local")}>
						{t("choice.keepLocal")}
					</Button>
					<p className="text-muted">{t("choice.keepLocalHint")}</p>
				</div>
				<div className="flex flex-1 flex-col gap-1">
					<Button onClick={() => void syncNow("keep-cloud")}>
						{t("choice.keepCloud")}
					</Button>
					<p className="text-muted">{t("choice.keepCloudHint")}</p>
				</div>
			</div>
		</SettingsCard>
	);
}

function ConflictRow({ conflict }: { conflict: Conflict }) {
	const t = useTranslations("sync.conflicts");
	const { playthroughs } = usePlaythrough();
	const { keepLocalValue } = useSync();
	const [section, chiefId, ...rest] = conflict.path;
	const chief = section === "playthroughs" ? playthroughs.find((c) => c.id === chiefId) : null;
	const where = [chief?.name ?? section, ...(chief ? rest : [chiefId, ...rest])]
		.filter(Boolean)
		.join(" / ");

	return (
		<li className="border-line flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0">
			<p className="font-mono">{where}</p>
			{conflict.kind === "delete-edit" && <p className="text-muted">{t("deletedEdited")}</p>}
			<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
				<dt className="text-muted">{t("cloudValue")}</dt>
				<dd className="font-mono break-all">{valueText(conflict.remote) ?? t("empty")}</dd>
				<dt className="text-muted">{t("deviceValue")}</dt>
				<dd className="font-mono break-all">{valueText(conflict.local) ?? t("empty")}</dd>
			</dl>
			<div>
				<Button onClick={() => keepLocalValue(conflict)}>{t("keepDevice")}</Button>
			</div>
		</li>
	);
}

function ConflictsCard() {
	const t = useTranslations("sync.conflicts");
	const { conflicts, dismissConflicts } = useSync();
	if (conflicts.length === 0) return null;

	return (
		<SettingsCard
			title={t("title")}
			description={t("body")}
			aside={
				<Button variant="ghost" onClick={dismissConflicts}>
					{t("dismiss")}
				</Button>
			}
		>
			<ul className="flex flex-col gap-3">
				{conflicts.map((conflict, index) => (
					<ConflictRow key={`${conflict.path.join("/")}-${index}`} conflict={conflict} />
				))}
			</ul>
		</SettingsCard>
	);
}

export function SyncTab() {
	const t = useTranslations("sync");
	const sync = useSync();

	if (!sync.available) {
		return (
			<SettingsCard title={t("tab.title")}>
				<Note>{t("unavailable")}</Note>
			</SettingsCard>
		);
	}

	const failureText: Record<SyncErrorKind | "reauth", string> = {
		rateLimit: t("error.rateLimit"),
		notFound: t("error.notFound"),
		forbidden: t("error.forbidden"),
		server: t("error.server"),
		data: t("error.data"),
		busy: t("error.busy"),
		other: t("error.other"),
		reauth: t("error.reauth"),
	};
	const failure = sync.status === "reauth" ? "reauth" : sync.errorKind;

	if (sync.status === "signedOut") {
		return (
			<SettingsCard title={t("signedOut.title")} description={t("signedOut.body")}>
				<Note>{t("privacy")}</Note>
				<div>
					<Button variant="primary" onClick={sync.signIn}>
						{t("signedOut.button")}
					</Button>
				</div>
			</SettingsCard>
		);
	}

	if (sync.status === "needsRepository") {
		return (
			<>
				<RepositoryPicker />
				<div>
					<Button variant="ghost" onClick={sync.signOut}>
						{t("connected.signOut")}
					</Button>
				</div>
			</>
		);
	}

	return (
		<>
			<SettingsCard
				title={t("connected.title")}
				description={t("tab.description")}
				aside={
					<Badge tone={sync.status === "idle" ? "added" : "changed"}>
						{t(`status.${sync.status}`)}
					</Badge>
				}
			>
				{failure && (
					<Note tone="warning">
						{failureText[failure]}
						{sync.errorStatus !== null && (
							<span className="block">
								{t("error.httpStatus", { status: String(sync.errorStatus) })}
							</span>
						)}
					</Note>
				)}
				<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
					<dt className="text-muted">{t("connected.repository")}</dt>
					<dd className="font-mono break-all">{sync.repository}</dd>
					<dt className="text-muted">{t("connected.lastSync")}</dt>
					<dd>
						{sync.lastSyncAt ? formatDateTime(sync.lastSyncAt) : t("connected.never")}
					</dd>
				</dl>
				<div className="flex flex-wrap gap-2">
					{sync.status === "reauth" ? (
						<Button variant="primary" onClick={sync.signIn}>
							{t("signedOut.button")}
						</Button>
					) : (
						<Button
							variant="primary"
							disabled={sync.status === "syncing" || sync.status === "needsChoice"}
							onClick={() => void sync.syncNow()}
						>
							{t("connected.syncNow")}
						</Button>
					)}
					<Button variant="danger" onClick={sync.signOut}>
						{t("connected.signOut")}
					</Button>
				</div>
			</SettingsCard>
			{sync.pendingChoice && (
				<ChoiceCard local={sync.pendingChoice.local} remote={sync.pendingChoice.remote} />
			)}
			<ConflictsCard />
		</>
	);
}
