(function () {
	'use strict';

	function copyText(text, button) {
		function markCopied() {
			var original = button.textContent;
			button.textContent = 'Copie';
			window.setTimeout(function () {
				button.textContent = original;
			}, 1400);
		}

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(markCopied);
			return;
		}

		var textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', 'readonly');
		textarea.style.position = 'absolute';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		markCopied();
	}

	document.addEventListener('click', function (event) {
		var button = event.target.closest('[data-zydka-copy]');

		if (!button) {
			return;
		}

		copyText(button.getAttribute('data-zydka-copy'), button);
	});
})();

(function () {
	'use strict';

	var root = document.querySelector('.zydka-library-page');
	var config = window.zydkaPlayerManagerAdmin || {};
	var state = {
		dragTrackId: '',
		reorderItem: null,
		reorderPlaylistId: '',
		selectedPlaylistId: ''
	};

	if (!root || !config.ajaxUrl) {
		return;
	}

	function message(text, type) {
		var container = document.getElementById('zydka-library-message');

		if (!container) {
			return;
		}

		container.innerHTML = '<div class="notice notice-' + (type || 'success') + ' is-dismissible"><p>' + escapeHtml(text) + '</p></div>';
	}

	function escapeHtml(value) {
		return String(value).replace(/[&<>"']/g, function (char) {
			return {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#039;'
			}[char];
		});
	}

	function request(action, data) {
		var form = new FormData();

		form.append('action', action);
		form.append('nonce', config.nonce || '');

		Object.keys(data || {}).forEach(function (key) {
			var value = data[key];

			if (Array.isArray(value)) {
				value.forEach(function (item) {
					form.append(key + '[]', item);
				});
				return;
			}

			form.append(key, value);
		});

		return window.fetch(config.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: form
		}).then(function (response) {
			return response.json();
		}).then(function (json) {
			if (!json || !json.success) {
				throw new Error(json && json.data && json.data.message ? json.data.message : config.i18n.genericError);
			}

			return json.data;
		});
	}

	function replacePlaylistCard(playlistId, html) {
		var current = root.querySelector('.zydka-playlist-card[data-playlist-id="' + playlistId + '"]');
		var template = document.createElement('div');

		template.innerHTML = html;

		if (current && template.firstElementChild) {
			current.replaceWith(template.firstElementChild);
		}
	}

	function replaceTrackCard(trackId, html) {
		var current = root.querySelector('.zydka-track-card[data-track-id="' + trackId + '"]');
		var template = document.createElement('div');

		template.innerHTML = html;

		if (current && template.firstElementChild) {
			current.replaceWith(template.firstElementChild);
		}
	}

	function updatePreview(playlistId, html) {
		var preview = document.getElementById('zydka-library-preview');

		if (!preview) {
			return;
		}

		state.selectedPlaylistId = String(playlistId || state.selectedPlaylistId || '');
		preview.innerHTML = html;
	}

	function renderPreviewFromCard(card) {
		var preview = document.getElementById('zydka-library-preview');
		var playlistId = card.getAttribute('data-playlist-id');
		var title = card.getAttribute('data-playlist-title') || '';
		var shortcode = card.getAttribute('data-shortcode') || '';
		var items = Array.prototype.map.call(card.querySelectorAll('.zydka-playlist-track'), function (item) {
			var trackTitle = item.getAttribute('data-track-title') || item.querySelector('.zydka-playlist-track-title').textContent;
			var audioUrl = item.getAttribute('data-audio-url') || '';
			var audio = audioUrl ? '<audio controls preload="none" src="' + escapeHtml(audioUrl) + '"></audio>' : '<span class="zydka-muted">Audio absent</span>';

			return '<li><strong>' + escapeHtml(trackTitle) + '</strong>' + audio + '</li>';
		}).join('');

		if (!preview) {
			return;
		}

		state.selectedPlaylistId = String(playlistId || '');
		preview.innerHTML = '<div class="zydka-preview-content" data-preview-playlist-id="' + escapeHtml(playlistId) + '"><h3>' + escapeHtml(title) + '</h3><p class="zydka-muted">' + card.querySelectorAll('.zydka-playlist-track').length + ' tracks dans cette playlist</p><ol class="zydka-preview-track-list">' + items + '</ol><div class="zydka-integration-options"><strong>Options d integration</strong><p>Shortcode : <code>' + escapeHtml(shortcode) + '</code></p><button type="button" class="button zydka-copy-button" data-zydka-copy="' + escapeHtml(shortcode) + '">Copier shortcode</button></div></div>';
	}

	function updatePlaylistCount(delta) {
		var count = document.getElementById('zydka-playlist-count');
		var value;

		if (!count) {
			return;
		}

		value = parseInt(count.textContent, 10) || 0;
		count.textContent = String(Math.max(0, value + delta));
	}

	function getPlaylistTrackIds(card) {
		return Array.prototype.map.call(card.querySelectorAll('[data-playlist-tracks] .zydka-playlist-track'), function (item) {
			return item.getAttribute('data-track-id');
		});
	}

	function getDragAfterElement(container, y) {
		var items = Array.prototype.slice.call(container.querySelectorAll('.zydka-playlist-track:not(.is-dragging)'));

		return items.reduce(function (closest, child) {
			var box = child.getBoundingClientRect();
			var offset = y - box.top - box.height / 2;

			if (offset < 0 && offset > closest.offset) {
				return { offset: offset, element: child };
			}

			return closest;
		}, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
	}

	function createPlaylist(event) {
		var input = root.querySelector('#zydka-new-playlist-title');
		var title = input ? input.value.trim() : '';

		event.preventDefault();

		if (!title) {
			message(config.i18n.playlistNameEmpty, 'warning');
			return;
		}

		request('zydka_library_create_playlist', { title: title }).then(function (data) {
			var grid = document.getElementById('zydka-playlist-grid');
			var template = document.createElement('div');

			template.innerHTML = data.playlistHtml;

			if (grid && template.firstElementChild) {
				grid.appendChild(template.firstElementChild);
				updatePlaylistCount(1);
			}

			input.value = '';
			updatePreview(data.playlistId, data.previewHtml);
			message(data.message, 'success');
		}).catch(function (error) {
			message(error.message, 'error');
		});
	}

	function addTrackToPlaylist(card, trackId) {
		var playlistId = card.getAttribute('data-playlist-id');

		request('zydka_library_add_track', {
			playlist_id: playlistId,
			track_id: trackId
		}).then(function (data) {
			replacePlaylistCard(data.playlistId, data.playlistHtml);
			updatePreview(data.playlistId, data.previewHtml);
			message(data.message, 'success');
		}).catch(function (error) {
			message(error.message, 'error');
		});
	}

	function reorderPlaylist(card) {
		var playlistId = card.getAttribute('data-playlist-id');
		var trackIds = getPlaylistTrackIds(card);

		request('zydka_library_reorder_playlist', {
			playlist_id: playlistId,
			track_ids: trackIds
		}).then(function (data) {
			replacePlaylistCard(data.playlistId, data.playlistHtml);
			updatePreview(data.playlistId, data.previewHtml);
			message(data.message, 'success');
		}).catch(function (error) {
			message(error.message, 'error');
		});
	}

	function removeTrack(button) {
		request('zydka_library_remove_track', {
			playlist_id: button.getAttribute('data-playlist-id'),
			track_id: button.getAttribute('data-track-id')
		}).then(function (data) {
			replacePlaylistCard(data.playlistId, data.playlistHtml);
			updatePreview(data.playlistId, data.previewHtml);
			message(data.message, 'success');
		}).catch(function (error) {
			message(error.message, 'error');
		});
	}

	function openMedia(button) {
		var kind = button.getAttribute('data-media-kind');
		var trackId = button.getAttribute('data-track-id');
		var frame;

		if (!window.wp || !wp.media) {
			message(config.i18n.genericError, 'error');
			return;
		}

		frame = wp.media({
			title: kind === 'cover' ? config.i18n.coverFrameTitle : config.i18n.audioFrameTitle,
			library: {
				type: kind === 'cover' ? 'image' : 'audio'
			},
			button: {
				text: kind === 'cover' ? config.i18n.useCover : config.i18n.useAudio
			},
			multiple: false
		});

		frame.on('select', function () {
			var attachment = frame.state().get('selection').first().toJSON();
			var action = kind === 'cover' ? 'zydka_library_update_cover' : 'zydka_library_update_audio';

			request(action, {
				track_id: trackId,
				attachment_id: attachment.id
			}).then(function (data) {
				replaceTrackCard(data.trackId, data.trackHtml);
				if (data.audioUrl) {
					root.querySelectorAll('.zydka-playlist-track[data-track-id="' + data.trackId + '"]').forEach(function (item) {
						item.setAttribute('data-audio-url', data.audioUrl);
					});
				}
				message(data.message, 'success');
			}).catch(function (error) {
				message(error.message, 'error');
			});
		});

		frame.open();
	}

	root.addEventListener('submit', function (event) {
		if (event.target && event.target.id === 'zydka-create-playlist-form') {
			createPlaylist(event);
		}
	});

	root.addEventListener('click', function (event) {
		var removeButton = event.target.closest('.zydka-remove-track');
		var mediaButton = event.target.closest('.zydka-media-button');
		var previewButton = event.target.closest('.zydka-preview-playlist');
		var playlistCard;

		if (removeButton) {
			event.preventDefault();
			removeTrack(removeButton);
			return;
		}

		if (mediaButton) {
			event.preventDefault();
			openMedia(mediaButton);
			return;
		}

		if (previewButton) {
			playlistCard = previewButton.closest('.zydka-playlist-card');
			if (playlistCard) {
				renderPreviewFromCard(playlistCard);
			}
		}
	});

	root.addEventListener('dragstart', function (event) {
		var trackCard = event.target.closest('.zydka-track-card');
		var playlistItem = event.target.closest('.zydka-playlist-track');
		var playlistCard;

		if (trackCard) {
			state.dragTrackId = trackCard.getAttribute('data-track-id');
			trackCard.classList.add('is-dragging');
			event.dataTransfer.setData('text/plain', state.dragTrackId);
			event.dataTransfer.effectAllowed = 'copy';
			return;
		}

		if (playlistItem) {
			playlistCard = playlistItem.closest('.zydka-playlist-card');
			state.reorderItem = playlistItem;
			state.reorderPlaylistId = playlistCard ? playlistCard.getAttribute('data-playlist-id') : '';
			playlistItem.classList.add('is-dragging');
			event.dataTransfer.effectAllowed = 'move';
		}
	});

	root.addEventListener('dragend', function (event) {
		var dragging = event.target.closest('.is-dragging');

		if (dragging) {
			dragging.classList.remove('is-dragging');
		}

		root.querySelectorAll('.is-drop-target').forEach(function (item) {
			item.classList.remove('is-drop-target');
		});

		state.dragTrackId = '';
		state.reorderItem = null;
		state.reorderPlaylistId = '';
	});

	root.addEventListener('dragover', function (event) {
		var playlistCard = event.target.closest('.zydka-playlist-card');
		var trackList = event.target.closest('[data-playlist-tracks]');
		var afterElement;

		if (trackList && state.reorderItem) {
			event.preventDefault();
			afterElement = getDragAfterElement(trackList, event.clientY);
			if (afterElement) {
				trackList.insertBefore(state.reorderItem, afterElement);
			} else {
				trackList.appendChild(state.reorderItem);
			}
			return;
		}

		if (playlistCard && state.dragTrackId) {
			event.preventDefault();
			playlistCard.classList.add('is-drop-target');
		}
	});

	root.addEventListener('dragleave', function (event) {
		var playlistCard = event.target.closest('.zydka-playlist-card');

		if (playlistCard && !playlistCard.contains(event.relatedTarget)) {
			playlistCard.classList.remove('is-drop-target');
		}
	});

	root.addEventListener('drop', function (event) {
		var playlistCard = event.target.closest('.zydka-playlist-card');
		var trackList = event.target.closest('[data-playlist-tracks]');

		if (trackList && state.reorderItem) {
			event.preventDefault();
			playlistCard = trackList.closest('.zydka-playlist-card');
			if (playlistCard) {
				reorderPlaylist(playlistCard);
			}
			return;
		}

		if (playlistCard && state.dragTrackId) {
			event.preventDefault();
			playlistCard.classList.remove('is-drop-target');
			addTrackToPlaylist(playlistCard, state.dragTrackId);
		}
	});
})();
