"use client";

import Hero from "@/components/ui/Hero";
import {
  SignFrameworkButton,
  OriginSourceButton,
} from "@/components/ui/Button";
import TextSection from "@/components/ui/TextSection";
import InformationCard from "@/components/ui/InformationCard";

export default function HomePage() {
  return (
    <div>
      <Hero
        title="Resource catalog of the EEG101 Community Framework: Towards a more reliable, open, and responsible science of EEG."
        subtitle="Discover our community framework, a text intended to bring the community together, defining our principles and exploring resources to put them into practice."
      >
        <SignFrameworkButton />
      </Hero>

      <div className="px-20">
        <div>
          <TextSection
            title="Our objectives"
            subtitle="Our goal is to make EEG science more robust and accessible to everyone. To this end, we have created this collaborative catalog that brings together practical resources (training courses, articles, videos, etc.) according to several criteria (topic, type, language). These resources enable researchers and laboratories to put EEG best practices into action and adapt their interventions to their needs."
          />
        </div>

        <div>
          <TextSection
            title="Our ethics"
            subtitle="EEG101 is based on clear principles"
          />
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 px-20 mb-8 mx-auto"
            style={{ maxWidth: "var(--container-max)" }}
          >
            <InformationCard
              content="Validity"
              href="/resources?section=part1"
            />
            <InformationCard
              content="Democratisation"
              href="/resources?section=part2"
            />
            <InformationCard
              content="Responsibility"
              href="/resources?section=part3"
            />
          </div>
          <TextSection subtitle="A community framework invites the community to commit to and adopt these principles in their daily practices." />
        </div>
      </div>
    </div>
  );
}
