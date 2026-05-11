import MateriasContent from '@/components/materias-content';
import topicoLinks from '@/data/topico-links.json';

export default function MateriasPage() {
  return <MateriasContent topicoLinks={topicoLinks} />;
}
