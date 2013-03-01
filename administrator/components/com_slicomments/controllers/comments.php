<?php
/**
 * @package		sliComments
 * @subpackage	Back end Component
 * @license		GNU General Public License version 3; see LICENSE.txt
 */

// No direct access
defined('_JEXEC') or die;

class sliCommentsControllerComments extends sliController
{
	public $default_view = 'comments';

	public function __construct($config = array())
	{
		parent::__construct($config);

		$this->registerTask('approve', 'status');
		$this->registerTask('unapprove', 'status');
		$this->registerTask('trash', 'status');
		$this->registerTask('spam', 'status');
		$this->registerTask('delete', 'status');
		$this->registerTask('unflag', 'status');
	}

	/**
	 * Removes a comment.
	 *
	 * @return  void
	 *
	 * @since   11.1
	 */
	public function status()
	{
		// Check for request forgeries
		JRequest::checkToken() or JRequest::checkToken('get') or die(JText::_('JINVALID_TOKEN'));

		// Get items to remove from the request.
		$id = JRequest::getVar('id', array(), '', 'array');

		if (!is_array($id) || count($id) < 1) {
			JError::raiseWarning(500, JText::_('COM_COMMENTS_NO_COMMENTS_SELECTED'));
		} else {
			// Get the model.
			$model = $this->getModel('comments');
			$user = JFactory::getUser();

			// Make sure the item ids are integers
			jimport('joomla.utilities.arrayhelper');
			JArrayHelper::toInteger($id);

			// Remove the items.
			try {
				switch ($this->task)
				{

					// Not actually a status change but it remain here to avoid code repetition
					case 'delete':
						if (!$user->authorise('edit', 'com_slicomments')){
							throw new JException(JText::_('COM_COMMENTS_NO_AUTH'), 403, E_WARNING);
						}
						$model->delete($id);
						$message = 'COM_COMMENTS_N_COMMENTS_DELETED';
						break;
					case 'unflag':
						if (!$user->authorise('manage', 'com_slicomments')){
							throw new JException(JText::_('COM_COMMENTS_NO_AUTH'), 403, E_WARNING);
						}
						$model->unflag($cid);
						$message = 'COM_COMMENTS_N_COMMENTS_UNFLAGGED';
						break;
					case 'approve':
					case 'unapprove':
					case 'trash':
					case 'spam':
						if (!$user->authorise('manage', 'com_slicomments')){
							throw new JException(JText::_('COM_COMMENTS_NO_AUTH'), 403, E_WARNING);
						}
						$model->status($id, $this->task);
						$message = 'COM_COMMENTS_N_COMMENTS_'.(strtoupper($this->task));
						break;
				}
				JFactory::getApplication()->enqueueMessage(JText::plural($message, count($id)));
			}
			catch(JException $e) {
				JError::throwError($e);
			}
		}

		$this->setRedirect('index.php?option=com_slicomments');
	}
}
