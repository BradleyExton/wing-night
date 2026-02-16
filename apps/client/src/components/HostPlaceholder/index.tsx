import {
  containerClassName,
  headingClassName,
  nextPhaseButtonClassName,
  subtextClassName
} from "./styles";
import { hostPlaceholderCopy } from "./copy";

type HostPlaceholderProps = {
  onNextPhase?: () => void;
};

export const HostPlaceholder = ({
  onNextPhase
}: HostPlaceholderProps): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>{hostPlaceholderCopy.title}</h1>
        <p className={subtextClassName}>{hostPlaceholderCopy.description}</p>
        <button
          className={nextPhaseButtonClassName}
          type="button"
          onClick={onNextPhase}
          disabled={onNextPhase === undefined}
        >
          {hostPlaceholderCopy.nextPhaseButtonLabel}
        </button>
      </div>
    </main>
  );
};
