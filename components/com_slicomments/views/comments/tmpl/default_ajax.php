<?php
/**
 * @package		sliComments
 * @subpackage	Front end Component
 * @license		GNU General Public License version 3; see LICENSE.txt
 */

// No direct access
defined('_JEXEC') or die;
?>
<ul id="comments_list" class="comment-list">
<?php
foreach ($this->comments as $comment) {
	$this->partial('comment', $comment);
}
?>
</ul>
<?php if ($this->params->get('limit', 20) > 0): ?>
<form id="comments_pagination" class="clr" action="<?php echo JRoute::_('index.php?option=com_slicomments&task=comments.display'); ?>" method="get">
	<div class="pagination">
		<?php echo $this->pagination->getPagesLinks(); ?>
	</div>
	<input type="hidden" name="article_id" value="<?php echo $this->state->get('article.id'); ?>" />
	<input type="hidden" name="slicommentslimitstart" value="" />
</form>
<?php endif; ?>