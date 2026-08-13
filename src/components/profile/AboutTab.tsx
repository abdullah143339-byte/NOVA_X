"use client";

import { motion } from "framer-motion";
import { GitBranch, Link2, AtSign, Globe, ExternalLink, Link as LinkIcon, GraduationCap, Briefcase, Award, Languages as LanguagesIcon } from "lucide-react";
import { useProfile } from "./ProfileProvider";
import { cn } from "@/lib/utils";
import type { CertificationItem, EducationItem, ExperienceItem, ProfilePayload } from "./types";

interface AboutTabProps {
  profile: ProfilePayload;
  aboutText: string;
  skills: string[];
  interests: string[];
  languages: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

export default function AboutTab({ profile, aboutText, skills, interests, languages, experience, education, certifications }: AboutTabProps) {
  const { prefs } = useProfile();
  const meta = profile.profile || {};

  const socialLinks: { id: string; label: string; href?: string | null; icon: React.ReactNode }[] = [
    { id: "github", label: "GitHub", href: meta.githubUrl, icon: <GitBranch className="w-4 h-4" /> },
    { id: "linkedin", label: "LinkedIn", href: meta.linkedinUrl, icon: <Link2 className="w-4 h-4" /> },
    { id: "twitter", label: "X / Twitter", href: meta.twitterUrl, icon: <AtSign className="w-4 h-4" /> },
    { id: "youtube", label: "YouTube", href: meta.youtubeUrl, icon: <Globe className="w-4 h-4" /> },
    { id: "portfolio", label: "Portfolio", href: meta.portfolioUrl, icon: <ExternalLink className="w-4 h-4" /> },
  ];
  const pinned = socialLinks.filter((s) => prefs.pinnedLinks.includes(s.id) || s.href);
  const shown = pinned.length > 0 ? pinned : socialLinks;

  const blocks: { title: string; icon: React.ReactNode; children: React.ReactNode }[] = [];

  if (aboutText.trim()) {
    blocks.push({
      title: "Professional Summary",
      icon: <Briefcase className="w-4 h-4 text-primary" />,
      children: <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{aboutText}</p>,
    });
  }

  if (experience.length > 0) {
    blocks.push({
      title: "Experience",
      icon: <Briefcase className="w-4 h-4 text-primary" />,
      children: (
        <div className="space-y-3">
          {experience.map((exp, i) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{exp.role}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">{exp.period}</span>
              </div>
              <p className="text-xs text-primary mt-0.5">{exp.company}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{exp.description}</p>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (education.length > 0) {
    blocks.push({
      title: "Education",
      icon: <GraduationCap className="w-4 h-4 text-primary" />,
      children: (
        <div className="space-y-2">
          {education.map((edu, i) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <p className="text-sm font-semibold text-foreground">{edu.degree}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{edu.school} · {edu.period}</p>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (skills.length > 0) {
    blocks.push({
      title: "Skills",
      icon: <Award className="w-4 h-4 text-primary" />,
      children: (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span key={skill} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{skill}</span>
          ))}
        </div>
      ),
    });
  }

  if (interests.length > 0 || languages.length > 0) {
    blocks.push({
      title: "Interests & Languages",
      icon: <LanguagesIcon className="w-4 h-4 text-primary" />,
      children: (
        <div className="space-y-3">
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {interests.map((interest) => (
                <span key={interest} className="px-3 py-1 rounded-full bg-muted text-xs text-foreground/80">{interest}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LanguagesIcon className="w-3.5 h-3.5" /> {languages.join(" · ")}
          </div>
        </div>
      ),
    });
  }

  if (certifications.length > 0) {
    blocks.push({
      title: "Certifications",
      icon: <Award className="w-4 h-4 text-primary" />,
      children: (
        <div className="space-y-2">
          {certifications.map((cert, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl bg-muted/40 p-3">
              <span className="text-base">📜</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{cert.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{cert.issuer} · {cert.year}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {blocks.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-foreground">No about info added yet</p>
            <p className="text-xs text-muted-foreground mt-1">This user hasn&apos;t written an about section yet.</p>
          </motion.div>
        ) : (
          blocks.map((block, i) => (
            <motion.div key={block.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide mb-3">{block.icon} {block.title}</h3>
              {block.children}
            </motion.div>
          ))
        )}
      </div>

      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide mb-3"><LinkIcon className="w-4 h-4 text-primary" /> Social Links</h3>
          <div className="space-y-2">
            {shown.map((link) => (
              <a
                key={link.id}
                href={link.href || undefined}
                target={link.href ? "_blank" : undefined}
                rel="noreferrer"
                className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all", link.href ? "bg-muted/40 text-foreground hover:bg-muted hover:text-primary" : "bg-muted/20 text-muted-foreground/60 cursor-default")}
              >
                {link.icon}
                <span className="flex-1">{link.label}</span>
                {link.href && <span className="text-[10px] text-muted-foreground">→</span>}
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">📍 Location</h3>
          <p className="text-sm text-foreground/85">{profile.location || "Location not set"}</p>
          <p className="text-xs text-muted-foreground mt-2">Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</p>
        </motion.div>
      </div>
    </div>
  );
}
