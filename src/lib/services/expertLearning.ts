import type { LearningJobState, Playthrough } from "@/types/app";
import { EXP_PER_LEARNING_MINUTE, learningSessions } from "@/data/game/experts";
import { buildExpertViews, skillCapOf, skillExpBetween } from "./experts";
import { learningJob, withLearningJob } from "./queues";

export interface LearningSession {
  label: string;
  minutes: number;
  exp: number;
}

export const sessions: LearningSession[] = learningSessions;

export interface LearningTarget {
  expertId: string;
  expertName: string;
  skills: {
    index: number;
    name: string;
    level: number;
    maxLevel: number;
    held: number;
    room: number;
  }[];
}

/**
 * The experts and skills that can learn. A not recruited expert, a skill that is not unlocked
 * (level 0) and a skill at its top level take no EXP.
 */
export const learningTargets = (chief: Playthrough): LearningTarget[] =>
  buildExpertViews(chief)
    .filter((view) => view.recruited)
    .map((view) => ({
      expertId: view.expert.id,
      expertName: view.expert.name,
      skills: view.expert.skills.flatMap((skill, index) => {
        const level = view.skillLevels[index];
        const cap = skillCapOf(view, index);
        const room = skillExpBetween(skill, level, cap) - view.skillExp[index];
        if (level < 1 || level >= cap || room <= 0) return [];
        return [
          {
            index,
            name: skill.name,
            level,
            maxLevel: cap,
            held: view.skillExp[index],
            room,
          },
        ];
      }),
    }))
    .filter((target) => target.skills.length > 0);

/**
 * A session that earns no more EXP than the skill has room for. The minutes shrink to the time
 * that the EXP needs, so the session does not run longer than it is useful.
 */
export const sessionWithinRoom = (
  session: LearningSession,
  room: number,
): LearningSession =>
  session.exp <= room
    ? session
    : {
        label: session.label,
        exp: room,
        minutes: Math.ceil(room / EXP_PER_LEARNING_MINUTE),
      };

export interface StartLearningInput {
  expertId: string;
  skillIndex: number;
  session: LearningSession;
  startedAt: Date;
  endsAt: Date;
}

/** Only one session runs for all the experts together, so a second start changes nothing. */
export const startLearning = (
  chief: Playthrough,
  input: StartLearningInput,
): Playthrough => {
  if (learningJob(chief)) return chief;
  const job: LearningJobState = {
    startedAt: input.startedAt.toISOString(),
    endsAt: input.endsAt.toISOString(),
    expertId: input.expertId,
    skillIndex: input.skillIndex,
    minutes: input.session.minutes,
    exp: input.session.exp,
  };
  return withLearningJob(chief, job);
};
