// Dữ liệu 78 lá (nội dung tiếng Việt tự biên soạn).
// Ảnh: bộ Rider–Waite–Smith bản in 1909 (Pamela Colman Smith, public domain).
// Cấu trúc mỗi dòng: [tên Việt, tên Anh, từ khoá xuôi, nghĩa xuôi, từ khoá ngược, nghĩa ngược]

const MAJOR = [
  ['Chàng Khờ', 'The Fool', 'khởi đầu · tự do · tin vào hành trình', 'Một chương mới mở ra. Hãy bước đi với trái tim rộng mở và dám chấp nhận rủi ro nhỏ để trải nghiệm điều mới.', 'liều lĩnh · ngây thơ · do dự', 'Cẩn thận với quyết định bốc đồng, hoặc ngược lại là nỗi sợ khiến bạn đứng yên. Nhìn kỹ trước khi nhảy.'],
  ['Nhà Ảo Thuật', 'The Magician', 'ý chí · kỹ năng · hiện thực hoá', 'Bạn đã có đủ công cụ trong tay. Đây là lúc tập trung và hành động để biến ý tưởng thành hiện thực.', 'phân tán · thao túng · lãng phí tiềm năng', 'Năng lượng đang bị phân tán hoặc có ai đó không thật lòng. Hãy kiểm tra lại động cơ và kế hoạch.'],
  ['Nữ Tư Tế', 'The High Priestess', 'trực giác · bí ẩn · tĩnh lặng', 'Câu trả lời nằm bên trong bạn. Lắng nghe trực giác, quan sát nhiều hơn thay vì vội hành động.', 'phớt lờ trực giác · bí mật · rối bời', 'Bạn đang bỏ qua tiếng nói bên trong, hoặc có điều gì đó bị che giấu. Hãy dành thời gian tĩnh lại.'],
  ['Hoàng Hậu', 'The Empress', 'trù phú · nuôi dưỡng · sáng tạo', 'Giai đoạn sinh sôi nảy nở: tình cảm, công việc, sáng tạo đều thuận lợi khi bạn chăm chút cho chúng.', 'bỏ bê bản thân · phụ thuộc · cạn cảm hứng', 'Bạn đang cho đi quá nhiều mà quên chăm sóc chính mình, hoặc nguồn cảm hứng tạm cạn.'],
  ['Hoàng Đế', 'The Emperor', 'kỷ luật · cấu trúc · quyền lực', 'Thành công đến từ kế hoạch rõ ràng và sự kiên định. Hãy chủ động làm chủ tình huống.', 'độc đoán · cứng nhắc · mất kiểm soát', 'Kiểm soát quá mức hoặc thiếu kỷ luật đang gây trở ngại. Cân bằng lại giữa quyền lực và sự linh hoạt.'],
  ['Giáo Hoàng', 'The Hierophant', 'truyền thống · người dẫn dắt · niềm tin', 'Học hỏi từ người đi trước, làm theo chuẩn mực hoặc tìm đến một người thầy sẽ giúp bạn vững vàng hơn.', 'phá lệ · nghi ngờ khuôn mẫu · tự do cá nhân', 'Bạn muốn đi con đường riêng, thoát khỏi khuôn khổ. Hãy chắc rằng đó là lựa chọn tỉnh táo.'],
  ['Tình Nhân', 'The Lovers', 'tình yêu · hoà hợp · lựa chọn từ trái tim', 'Một sự gắn kết sâu sắc, hoặc một lựa chọn quan trọng dựa trên giá trị thật của bạn.', 'lệch pha · lựa chọn sai · xa cách', 'Có sự mất cân bằng trong mối quan hệ, hoặc bạn đang chọn điều trái với giá trị của mình.'],
  ['Cỗ Xe', 'The Chariot', 'quyết tâm · chiến thắng · tiến lên', 'Khi làm chủ được những cảm xúc trái chiều, bạn sẽ vượt qua trở ngại và tiến thẳng tới mục tiêu.', 'mất phương hướng · thiếu kiểm soát · chùn bước', 'Bạn đang bị kéo về nhiều hướng. Xác định lại đích đến trước khi tăng tốc.'],
  ['Sức Mạnh', 'Strength', 'can đảm · kiên nhẫn · sức mạnh mềm', 'Sự dịu dàng và bền bỉ mạnh hơn mọi cưỡng ép. Bạn có đủ nội lực để vượt qua thử thách này.', 'tự ti · nóng giận · kiệt sức', 'Sự nghi ngờ bản thân hoặc cảm xúc bùng phát đang lấy mất sức mạnh của bạn.'],
  ['Ẩn Sĩ', 'The Hermit', 'chiêm nghiệm · nội tâm · minh triết', 'Lùi lại một bước, dành thời gian cho riêng mình để tìm ra câu trả lời thật sự.', 'cô lập · trốn tránh · lạc lối', 'Ở một mình quá lâu dễ khiến bạn cô độc. Đã đến lúc kết nối lại với mọi người.'],
  ['Vòng Quay Số Phận', 'Wheel of Fortune', 'bước ngoặt · vận may · chu kỳ', 'Bánh xe đang quay theo hướng có lợi. Hãy sẵn sàng nắm bắt cơ hội khi thời điểm đến.', 'trắc trở tạm thời · kháng cự thay đổi', 'Một giai đoạn không như ý, nhưng mọi chu kỳ đều qua đi. Đừng cố níu giữ điều đã hết.'],
  ['Công Lý', 'Justice', 'công bằng · sự thật · nhân quả', 'Mọi việc sẽ được phân định rõ ràng. Hãy trung thực và chịu trách nhiệm cho lựa chọn của mình.', 'thiên lệch · né tránh trách nhiệm · thiếu minh bạch', 'Có điều gì đó chưa rõ ràng. Hãy xem lại mình đã thật sự công bằng — với người và với mình — chưa.'],
  ['Người Treo Ngược', 'The Hanged Man', 'tạm dừng · buông bỏ · góc nhìn mới', 'Chấp nhận chờ đợi và nhìn vấn đề từ góc khác; một sự hy sinh nhỏ mở ra hiểu biết lớn.', 'trì trệ · hy sinh vô ích · chống cự', 'Bạn đang mắc kẹt vì không chịu buông. Chờ đợi mãi không phải là giải pháp.'],
  ['Cái Chết', 'Death', 'kết thúc · chuyển hoá · tái sinh', 'Một chương khép lại để chương mới bắt đầu. Đây là sự thay đổi cần thiết, không phải điều đáng sợ.', 'níu kéo · sợ thay đổi · trì hoãn', 'Việc níu giữ điều đã cũ đang cản bước bạn. Hãy cho phép mình khép lại.'],
  ['Tiết Chế', 'Temperance', 'cân bằng · hài hoà · kiên nhẫn', 'Sự điều độ và kết hợp khéo léo sẽ mang lại kết quả tốt đẹp. Chậm mà chắc.', 'thái quá · mất cân bằng · nóng vội', 'Bạn đang làm quá một điều gì đó. Hãy tìm lại nhịp độ và sự điều độ.'],
  ['Ác Quỷ', 'The Devil', 'ràng buộc · cám dỗ · ham muốn', 'Có một thói quen, mối quan hệ hay nỗi sợ đang trói buộc bạn. Nhận ra nó là bước đầu để tự do.', 'giải thoát · phá xiềng · tỉnh ngộ', 'Bạn đang dần thoát khỏi điều kìm hãm mình. Hãy giữ vững quyết tâm.'],
  ['Toà Tháp', 'The Tower', 'biến động · sụp đổ · thức tỉnh', 'Một thay đổi đột ngột phá vỡ nền móng cũ, nhưng nó giải phóng bạn khỏi những gì không bền vững.', 'né tránh khủng hoảng · thay đổi từ bên trong', 'Bạn đang cố trì hoãn điều khó tránh. Chủ động thay đổi từ bên trong sẽ bớt đau hơn.'],
  ['Ngôi Sao', 'The Star', 'hy vọng · chữa lành · cảm hứng', 'Sau giông bão là bình yên. Hãy tin vào tương lai và cho phép bản thân được chữa lành.', 'mất niềm tin · nản lòng · mất kết nối', 'Bạn đang tạm mất hy vọng. Hãy tìm lại những điều nhỏ bé khiến bạn tin tưởng.'],
  ['Mặt Trăng', 'The Moon', 'mơ hồ · trực giác · nỗi sợ vô hình', 'Không phải mọi thứ đều như vẻ ngoài. Đi chậm, tin trực giác và cẩn trọng với ảo tưởng.', 'sáng tỏ · vượt qua sợ hãi · sự thật lộ diện', 'Sương mù đang tan dần; sự thật được phơi bày và bạn bớt lo âu hơn.'],
  ['Mặt Trời', 'The Sun', 'thành công · niềm vui · rõ ràng', 'Một trong những lá tích cực nhất: niềm vui, sự minh bạch và thành quả đang đến với bạn.', 'niềm vui bị che khuất · lạc quan quá mức', 'Niềm vui vẫn ở đó nhưng tạm bị che mờ. Giữ tinh thần tích cực nhưng thực tế.'],
  ['Phán Xét', 'Judgement', 'thức tỉnh · tiếng gọi · tổng kết', 'Thời điểm nhìn lại, tha thứ và đáp lại tiếng gọi bên trong để bước lên một nấc thang mới.', 'tự phán xét · nghi ngờ · bỏ lỡ tiếng gọi', 'Bạn đang quá khắt khe với bản thân hoặc chần chừ trước một quyết định quan trọng.'],
  ['Thế Giới', 'The World', 'hoàn thành · viên mãn · trọn vẹn', 'Một hành trình đã đến đích. Hãy ăn mừng thành quả và chuẩn bị cho chu kỳ mới.', 'dang dở · thiếu kết thúc · trì hoãn', 'Vẫn còn một mảnh ghép chưa hoàn thiện. Hoàn tất nó trước khi bắt đầu điều mới.'],
];

// 14 lá mỗi bộ: Át, 2–10, Tiểu Đồng, Hiệp Sĩ, Nữ Hoàng, Vua
const SUITS = {
  wands: {
    vi: 'Gậy', en: 'Wands', element: 'Lửa',
    cards: [
      ['cảm hứng · khởi đầu · đam mê', 'Một tia lửa mới: ý tưởng, dự án hay đam mê đang chờ bạn bắt tay vào.', 'trì hoãn · thiếu động lực', 'Ý tưởng có nhưng năng lượng chưa đủ; có thể chưa đúng thời điểm.'],
      ['lập kế hoạch · tầm nhìn · quyết định', 'Bạn đứng trước lựa chọn mở rộng. Lên kế hoạch dài hạn trước khi bước ra.', 'sợ điều mới · kế hoạch chưa chắc', 'Nỗi sợ rời vùng an toàn khiến bạn chần chừ.'],
      ['mở rộng · chờ thành quả · tầm xa', 'Những gì bạn gieo đang bắt đầu có kết quả; cơ hội ở phía xa đang đến gần.', 'chậm trễ · trở ngại · tầm nhìn hẹp', 'Kế hoạch chậm hơn dự kiến; kiên nhẫn điều chỉnh.'],
      ['ăn mừng · ổn định · mái ấm', 'Niềm vui, sự hoà hợp và một cột mốc đáng ăn mừng cùng người thân.', 'bất ổn gia đình · thiếu gắn kết', 'Có chút xáo trộn ở nơi lẽ ra là chốn bình yên.'],
      ['cạnh tranh · va chạm · bất đồng', 'Nhiều ý kiến trái chiều; xung đột nhỏ có thể là cơ hội để hoàn thiện.', 'né xung đột · thoả hiệp', 'Căng thẳng dịu xuống, hoặc bạn đang né một cuộc trao đổi cần thiết.'],
      ['chiến thắng · được công nhận · tự tin', 'Nỗ lực của bạn được ghi nhận; thành công mang lại sự tự tin.', 'thiếu công nhận · tự cao', 'Kết quả chưa như mong đợi, hoặc cái tôi đang lớn hơn thực lực.'],
      ['giữ lập trường · kiên định · thử thách', 'Bạn đang ở thế thượng phong — hãy giữ vững quan điểm trước áp lực.', 'choáng ngợp · buông xuôi', 'Áp lực từ nhiều phía khiến bạn mệt; hãy chọn trận đáng để đánh.'],
      ['tốc độ · tin tức · chuyển động', 'Mọi việc tiến triển nhanh; tin tức hoặc một chuyến đi sắp đến.', 'chậm trễ · vội vàng · lỡ nhịp', 'Có sự trì hoãn, hoặc bạn vội đến mức mất tập trung.'],
      ['bền bỉ · phòng thủ · gần tới đích', 'Bạn đã mệt nhưng chỉ còn một chặng ngắn; đừng bỏ cuộc lúc này.', 'kiệt sức · đa nghi', 'Sự mệt mỏi và đề phòng quá mức đang bào mòn bạn.'],
      ['gánh nặng · trách nhiệm · quá tải', 'Bạn đang ôm quá nhiều việc; hãy học cách chia sẻ và uỷ thác.', 'buông bớt · giải toả', 'Đã đến lúc đặt bớt gánh nặng xuống trước khi quá muộn.'],
      ['nhiệt huyết · khám phá · tin tốt', 'Tinh thần háo hức muốn thử điều mới; một tin vui liên quan tới dự án.', 'thiếu định hướng · nóng vội', 'Nhiều ý tưởng nhưng thiếu kiên trì để theo đến cùng.'],
      ['hành động · phiêu lưu · táo bạo', 'Năng lượng mạnh mẽ đẩy bạn lao về phía trước — hãy dám làm.', 'bốc đồng · bỏ dở', 'Hành động quá vội có thể khiến kế hoạch đổ vỡ giữa chừng.'],
      ['tự tin · cuốn hút · quyết đoán', 'Hãy toả sáng bằng sự ấm áp và tự tin; bạn truyền cảm hứng cho người khác.', 'bất an · đố kỵ · nóng nảy', 'Sự bất an có thể biến thành ganh tị hoặc nóng giận.'],
      ['lãnh đạo · tầm nhìn · dám nghĩ lớn', 'Bạn có tầm nhìn và khả năng dẫn dắt; hãy chủ động cầm trịch.', 'độc đoán · kỳ vọng quá cao', 'Ép người khác theo ý mình sẽ phản tác dụng.'],
    ],
  },
  cups: {
    vi: 'Cốc', en: 'Cups', element: 'Nước',
    cards: [
      ['tình cảm mới · yêu thương · cảm xúc dâng trào', 'Trái tim rộng mở: một mối quan hệ, tình bạn hay niềm vui tinh thần mới.', 'kìm nén · trống rỗng', 'Bạn đang khép lòng hoặc cảm xúc chưa được bày tỏ.'],
      ['kết nối · đồng điệu · hợp tác', 'Sự thu hút và thấu hiểu lẫn nhau; một mối quan hệ cân bằng.', 'hiểu lầm · lệch pha', 'Có khoảng cách hoặc hiểu lầm cần được nói rõ.'],
      ['tình bạn · ăn mừng · cộng đồng', 'Niềm vui bên bạn bè, những cuộc hội ngộ và sự hỗ trợ từ tập thể.', 'buông thả · thị phi', 'Cẩn thận với tiệc tùng quá đà hoặc chuyện điều tiếng trong nhóm.'],
      ['chán nản · thờ ơ · bỏ lỡ', 'Bạn mải nhìn điều còn thiếu mà không thấy cơ hội đang được trao.', 'tỉnh ra · đón nhận', 'Bạn bắt đầu thoát khỏi sự trì trệ và sẵn sàng đón nhận.'],
      ['mất mát · tiếc nuối · buồn bã', 'Nỗi buồn là thật, nhưng vẫn còn những điều tốt đẹp đứng vững phía sau bạn.', 'chấp nhận · chữa lành', 'Bạn đang dần vượt qua mất mát và nhìn về phía trước.'],
      ['hoài niệm · kỷ niệm · trong trẻo', 'Kỷ niệm đẹp, người cũ hoặc sự hồn nhiên ngày trước quay trở lại.', 'mắc kẹt quá khứ', 'Sống mãi với quá khứ khiến bạn khó tiến lên.'],
      ['nhiều lựa chọn · mơ mộng · ảo tưởng', 'Có quá nhiều lựa chọn hấp dẫn — không phải tất cả đều có thật.', 'rõ ràng · tỉnh mộng', 'Bạn bắt đầu nhìn rõ điều gì thực sự quan trọng.'],
      ['ra đi · tìm ý nghĩa · buông bỏ', 'Bạn sẵn sàng rời khỏi điều không còn nuôi dưỡng tâm hồn mình.', 'lưỡng lự · sợ rời đi', 'Bạn biết nên đi nhưng vẫn còn do dự.'],
      ['mãn nguyện · điều ước thành thật', 'Lá bài của điều ước: sự hài lòng và niềm vui đang đến gần.', 'tự mãn · ước muốn chưa thành', 'Điều bạn muốn chưa đến, hoặc niềm vui chỉ ở bề mặt.'],
      ['hạnh phúc · viên mãn · hoà thuận', 'Bình yên, yêu thương và một mái ấm trọn vẹn.', 'bất hoà · kỳ vọng lệch nhau', 'Có khoảng cách giữa hình ảnh lý tưởng và thực tế trong mối quan hệ.'],
      ['tin vui tình cảm · sáng tạo · nhạy cảm', 'Một lời tỏ bày, tin nhắn dễ thương hoặc ý tưởng sáng tạo bất ngờ.', 'thất thường · non nớt', 'Cảm xúc lên xuống thất thường hoặc kỳ vọng quá mơ mộng.'],
      ['lãng mạn · lời mời · theo tiếng gọi trái tim', 'Một lời đề nghị lãng mạn hoặc cơ hội theo đuổi điều trái tim mách bảo.', 'hứa suông · ảo tưởng', 'Cẩn thận với lời hứa đẹp nhưng thiếu hành động.'],
      ['thấu cảm · dịu dàng · trực giác', 'Bạn thấu hiểu và xoa dịu người khác bằng sự dịu dàng của mình.', 'kiệt sức vì cho đi · phụ thuộc cảm xúc', 'Bạn đang gánh cảm xúc của người khác mà quên mất bản thân.'],
      ['điềm tĩnh · bao dung · cân bằng cảm xúc', 'Làm chủ cảm xúc giúp bạn đưa ra quyết định sáng suốt.', 'dồn nén · thao túng cảm xúc', 'Cảm xúc bị kìm nén có thể bùng phát ngoài kiểm soát.'],
    ],
  },
  swords: {
    vi: 'Kiếm', en: 'Swords', element: 'Khí',
    cards: [
      ['sáng suốt · sự thật · đột phá', 'Một ý tưởng sắc bén hoặc sự thật rõ ràng giúp bạn phá vỡ bế tắc.', 'rối trí · thông tin sai', 'Suy nghĩ đang hỗn loạn; hãy kiểm chứng trước khi hành động.'],
      ['phân vân · bế tắc · né tránh', 'Bạn đang tránh đưa ra quyết định; hãy tháo tấm bịt mắt để nhìn rõ.', 'quá tải · buộc phải chọn', 'Không thể trì hoãn mãi; lựa chọn đang đến.'],
      ['tổn thương · đau lòng · chia ly', 'Một nỗi đau cần được thừa nhận để có thể chữa lành.', 'hồi phục · tha thứ', 'Vết thương đang lành dần; bạn học được cách buông bỏ.'],
      ['nghỉ ngơi · hồi phục · tĩnh tâm', 'Cho mình một khoảng lặng để nạp lại năng lượng trước chặng tiếp theo.', 'kiệt sức · bồn chồn', 'Cơ thể và tâm trí đang lên tiếng — đừng phớt lờ.'],
      ['xung đột · thắng không vẻ vang · tự ái', 'Thắng được cuộc tranh cãi nhưng có thể mất đi mối quan hệ.', 'hoà giải · bỏ qua tự ái', 'Đã đến lúc làm hoà và rút kinh nghiệm.'],
      ['chuyển tiếp · rời xa sóng gió', 'Bạn đang rời khỏi giai đoạn khó khăn để đến vùng nước yên bình hơn.', 'chưa thể rời đi', 'Những hành trang cảm xúc cũ khiến bạn khó tiến lên.'],
      ['mưu mẹo · bí mật · chiến lược', 'Cần khôn khéo, nhưng cẩn thận với sự lừa dối — của người khác hoặc chính mình.', 'lộ diện · thú nhận', 'Bí mật khó giữ; sự thật đang dần lộ ra.'],
      ['tự giới hạn · mắc kẹt · sợ hãi', 'Những ràng buộc chủ yếu nằm trong suy nghĩ; bạn tự do hơn bạn tưởng.', 'giải phóng · góc nhìn mới', 'Bạn đang tháo gỡ nỗi sợ và tìm ra lối thoát.'],
      ['lo âu · mất ngủ · suy nghĩ tiêu cực', 'Nỗi lo trong đầu lớn hơn thực tế; hãy chia sẻ với ai đó.', 'vượt qua lo âu · hy vọng', 'Những đêm dài đang qua; bạn thấy nhẹ lòng hơn.'],
      ['chạm đáy · kết thúc đau đớn', 'Chạm đáy cũng có nghĩa là từ đây chỉ còn đường đi lên.', 'hồi sinh · bắt đầu lại', 'Điều tồi tệ nhất đã qua; bạn đang đứng dậy.'],
      ['tò mò · ham học · quan sát', 'Tinh thần ham hiểu biết; quan sát kỹ trước khi lên tiếng.', 'nói không suy nghĩ · tin đồn', 'Cẩn thận với lời nói và chuyện của người khác.'],
      ['quyết liệt · thẳng thắn · nhanh nhạy', 'Lao vào mục tiêu với sự sắc bén và tốc độ.', 'hấp tấp · gay gắt', 'Nói và làm quá nhanh có thể gây tổn thương.'],
      ['sắc sảo · độc lập · rõ ràng', 'Nhìn thẳng vào sự thật, đặt ranh giới rõ ràng và giao tiếp minh bạch.', 'lạnh lùng · cay nghiệt', 'Lý trí quá mức khiến bạn trở nên xa cách.'],
      ['lý trí · công minh · uy tín', 'Quyết định dựa trên logic và nguyên tắc sẽ mang lại kết quả tốt.', 'áp đặt · lạm quyền', 'Cẩn thận khi lý lẽ bị dùng để áp đặt người khác.'],
    ],
  },
  pentacles: {
    vi: 'Tiền', en: 'Pentacles', element: 'Đất',
    cards: [
      ['cơ hội tài chính · khởi đầu vững chắc', 'Một cơ hội thực tế về tiền bạc, công việc hoặc sức khoẻ đang mở ra.', 'bỏ lỡ cơ hội · thiếu thực tế', 'Cân nhắc kỹ trước khi đầu tư; đừng để vuột mất điều tốt.'],
      ['cân bằng · linh hoạt · xoay xở', 'Bạn đang tung hứng nhiều việc; ưu tiên hợp lý sẽ giữ được nhịp.', 'quá tải · mất cân đối', 'Quá nhiều thứ cùng lúc; cần sắp xếp lại.'],
      ['hợp tác · tay nghề · được ghi nhận', 'Làm việc nhóm và chuyên môn vững vàng sẽ tạo ra thành quả chất lượng.', 'thiếu phối hợp · làm qua loa', 'Nhóm lệch nhịp hoặc chất lượng công việc chưa tốt.'],
      ['tích luỹ · an toàn · giữ chặt', 'Bạn đang bảo vệ những gì mình có; ổn định nhưng coi chừng quá khép kín.', 'chi tiêu quá tay · bám víu', 'Mối quan hệ của bạn với tiền bạc cần cân bằng lại.'],
      ['khó khăn · thiếu thốn · lạc lõng', 'Giai đoạn chật vật; hãy tìm sự giúp đỡ — nó ở gần hơn bạn nghĩ.', 'hồi phục · tìm được hỗ trợ', 'Khó khăn đang qua; tình hình dần cải thiện.'],
      ['cho và nhận · hào phóng · hỗ trợ', 'Dòng chảy tài chính cân bằng; bạn giúp đỡ hoặc được giúp đỡ.', 'nợ nần · giúp có điều kiện', 'Cẩn thận với sự giúp đỡ đi kèm ràng buộc.'],
      ['kiên nhẫn · đầu tư dài hạn · đánh giá', 'Thành quả cần thời gian; xem lại chiến lược trước khi gieo tiếp.', 'nóng vội · kém hiệu quả', 'Công sức chưa mang lại kết quả như kỳ vọng; hãy điều chỉnh hướng đi.'],
      ['chăm chỉ · rèn luyện · tỉ mỉ', 'Sự tập trung và luyện tập đều đặn đang nâng cao tay nghề của bạn.', 'cầu toàn · nhàm chán', 'Công việc trở nên lặp lại hoặc bạn đang quá khắt khe.'],
      ['độc lập · sung túc · tận hưởng', 'Bạn gặt hái thành quả từ sự tự lực; hãy tận hưởng điều mình xứng đáng.', 'làm quá sức · phụ thuộc', 'Sự sung túc chưa bền vững, hoặc bạn quên nghỉ ngơi.'],
      ['thịnh vượng lâu dài · gia đình · di sản', 'Tài chính ổn định và một nền tảng vững chắc cho lâu dài.', 'tranh chấp tài sản · bất ổn', 'Chuyện tiền bạc trong gia đình cần được giải quyết rõ ràng.'],
      ['học hỏi · cơ hội mới · thực tế', 'Một cơ hội học tập hay công việc mới đáng để bạn nghiêm túc đầu tư.', 'trì hoãn · thiếu tập trung', 'Kế hoạch tốt nhưng chưa được bắt tay thực hiện.'],
      ['kiên trì · đáng tin · đều đặn', 'Chậm mà chắc; sự bền bỉ sẽ đưa bạn đến đích.', 'trì trệ · cứng nhắc', 'Quá thận trọng khiến bạn giậm chân tại chỗ.'],
      ['chu đáo · thực tế · chăm lo', 'Cân bằng giữa công việc và gia đình; bạn tạo cảm giác an toàn cho người xung quanh.', 'lo toan quá mức · quên bản thân', 'Bạn lo cho mọi người mà quên chăm sóc mình.'],
      ['thành đạt · vững vàng · quản lý giỏi', 'Sự thịnh vượng đến từ kỷ luật và quản lý tài chính khôn ngoan.', 'tham vọng vật chất · cứng nhắc', 'Đừng để tiền bạc trở thành thước đo duy nhất.'],
    ],
  },
};

const RANK_VI = ['Át', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Tiểu Đồng', 'Hiệp Sĩ', 'Nữ Hoàng', 'Vua'];
const RANK_EN = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

const pad = (n) => String(n).padStart(2, '0');

function build() {
  const deck = MAJOR.map(([vi, en, kUp, up, kRev, rev], i) => ({
    id: `major-${pad(i)}`,
    arcana: 'major',
    suit: null,
    numeral: ROMAN[i],
    vi,
    en,
    img: `assets/cards/major-${pad(i)}.jpg`,
    keysUp: kUp,
    up,
    keysRev: kRev,
    rev,
  }));
  for (const [suit, s] of Object.entries(SUITS)) {
    s.cards.forEach(([kUp, up, kRev, rev], i) => {
      deck.push({
        id: `${suit}-${pad(i + 1)}`,
        arcana: 'minor',
        suit,
        numeral: i < 10 ? String(i + 1) : '',
        vi: `${RANK_VI[i]} ${s.vi}`,
        en: `${RANK_EN[i]} of ${s.en}`,
        img: `assets/cards/${suit}-${pad(i + 1)}.jpg`,
        keysUp: kUp,
        up,
        keysRev: kRev,
        rev,
      });
    });
  }
  return deck;
}

export const DECK = build();
export const SUIT_INFO = Object.fromEntries(Object.entries(SUITS).map(([k, v]) => [k, { vi: v.vi, element: v.element }]));

export const SPREADS = {
  daily: {
    name: 'Thông điệp hôm nay',
    short: '1 lá',
    positions: [{ label: 'Thông điệp', hint: 'Năng lượng chủ đạo và lời nhắn dành cho bạn hôm nay.' }],
  },
  time: {
    name: 'Quá khứ · Hiện tại · Tương lai',
    short: '3 lá',
    positions: [
      { label: 'Quá khứ', hint: 'Những gì đã hình thành nên tình huống hiện tại.' },
      { label: 'Hiện tại', hint: 'Năng lượng đang chi phối bạn lúc này.' },
      { label: 'Tương lai', hint: 'Xu hướng sắp tới nếu bạn giữ hướng đi hiện tại.' },
    ],
  },
  love: {
    name: 'Tình yêu',
    short: '3 lá',
    positions: [
      { label: 'Bạn', hint: 'Cảm xúc và mong muốn của bạn trong mối quan hệ.' },
      { label: 'Người ấy', hint: 'Góc nhìn và năng lượng của đối phương.' },
      { label: 'Mối quan hệ', hint: 'Điều đang diễn ra giữa hai người và hướng phát triển.' },
    ],
  },
  career: {
    name: 'Công việc & Tài chính',
    short: '5 lá',
    positions: [
      { label: 'Hiện trạng', hint: 'Bức tranh công việc/tài chính hiện tại.' },
      { label: 'Trở ngại', hint: 'Điều đang cản bước bạn.' },
      { label: 'Điểm mạnh', hint: 'Nguồn lực bạn có thể dựa vào.' },
      { label: 'Lời khuyên', hint: 'Hành động nên ưu tiên.' },
      { label: 'Kết quả', hint: 'Kết quả khả dĩ nếu làm theo lời khuyên.' },
    ],
  },
};

const ELEMENT_TEXT = {
  wands: 'Lửa (Gậy) chiếm ưu thế: câu chuyện xoay quanh đam mê, hành động và sự chủ động.',
  cups: 'Nước (Cốc) chiếm ưu thế: cảm xúc và các mối quan hệ là trọng tâm lúc này.',
  swords: 'Khí (Kiếm) chiếm ưu thế: suy nghĩ, giao tiếp và những quyết định lý trí đang được thử thách.',
  pentacles: 'Đất (Tiền) chiếm ưu thế: công việc, tiền bạc và những điều thực tế cần được chú ý.',
};

// Tổng hợp nhận định chung từ cả trải bài
export function summarize(draws) {
  const n = draws.length;
  const lines = [];
  const majors = draws.filter((d) => d.card.arcana === 'major').length;
  const reversed = draws.filter((d) => d.reversed).length;
  if (n > 1 && majors >= Math.ceil(n / 2)) {
    lines.push('Nhiều lá Ẩn Chính xuất hiện: đây là giai đoạn mang tính bước ngoặt, những bài học lớn đang diễn ra.');
  } else if (n > 1 && majors === 0) {
    lines.push('Toàn lá Ẩn Phụ: vấn đề nằm trong tầm tay bạn — thay đổi từ những việc hằng ngày sẽ tạo ra khác biệt.');
  }
  const counts = {};
  draws.forEach((d) => d.card.suit && (counts[d.card.suit] = (counts[d.card.suit] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2) lines.push(ELEMENT_TEXT[top[0]]);
  if (n > 1 && reversed > n / 2) {
    lines.push('Nhiều lá ngược: năng lượng đang bị tắc hoặc hướng vào bên trong. Hãy chậm lại, nhìn lại mình trước khi hành động.');
  } else if (n > 1 && reversed === 0) {
    lines.push('Tất cả lá đều xuôi: dòng chảy đang thuận, hãy tận dụng thời điểm này.');
  }
  if (!lines.length) lines.push('Hãy đọc từng lá theo vị trí và để trực giác kết nối chúng thành câu chuyện của riêng bạn.');
  return lines;
}
