import { AssignedCard } from '@/components/AssignedCard';
import { HomeStart } from '@/components/HomeStart';
import { SavedPlanLink } from '@/components/SavedPlanLink';
import { KingfisherHome } from '@/components/home/KingfisherHome';

/*
 * Home (redesign, Nov 14): a kingfisher flies in and lands, the headline and "Try it now" appear beside or under it,
 * and below a leafy branch: the therapist's assignment (if any), the saved plan (if any), then the next step
 * (the checks for a first visit, lessons after a hearing check).
 */
export default function Home() {
  return (
    <KingfisherHome>
      <main className="flex flex-col gap-6">
        <AssignedCard />
        <SavedPlanLink />
        <HomeStart />
      </main>
    </KingfisherHome>
  );
}
