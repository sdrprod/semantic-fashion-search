import { useFeedback } from '@/hooks/useFeedback';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  productId: string;
}

export function FeedbackButtons({ productId }: FeedbackButtonsProps) {
  const { vote, isLoading, submitVote } = useFeedback(productId);

  return (
    <div className="feedback-buttons">
      <button
        onClick={() => submitVote(1)}
        disabled={isLoading}
        className={`feedback-button ${vote === 1 ? 'active' : ''}`}
        aria-label="Upvote this product"
        title="I like this result"
      >
        <ThumbsUp size={18} />
      </button>
      <button
        onClick={() => submitVote(-1)}
        disabled={isLoading}
        className={`feedback-button ${vote === -1 ? 'active' : ''}`}
        aria-label="Downvote this product"
        title="This result isn't relevant"
      >
        <ThumbsDown size={18} />
      </button>
    </div>
  );
}
